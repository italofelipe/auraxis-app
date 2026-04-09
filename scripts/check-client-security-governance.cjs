#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const ROOT = process.cwd();
const PRODUCT_DIRECTORIES = [
  "app",
  "components",
  "config",
  "constants",
  "core",
  "features",
  "hooks",
  "schemas",
  "shared",
  "stores",
  "types",
];
const CODE_EXTENSIONS = new Set([".ts", ".tsx"]);
const CODE_FILE_EXCLUDE_PATTERNS = [
  /\.test\.tsx?$/u,
  /\.spec\.tsx?$/u,
  /__tests__\//u,
];
const BANNED_ENV_LITERAL_KEYS = [
  "AURAXIS_UNLEASH_API_TOKEN",
  "EXPO_PUBLIC_OBSERVABILITY_EXPORT_TOKEN",
];
const SENSITIVE_PROCESS_ENV_PATTERN =
  /\bprocess\.env\.([A-Z0-9_]*(?:SECRET|PASSWORD|PRIVATE_KEY|ACCESS_TOKEN|REFRESH_TOKEN|API_TOKEN)[A-Z0-9_]*)\b/u;
const SENSITIVE_APP_CONFIG_EXTRA_KEY_PATTERN =
  /(token|secret|password|private[_-]?key|access[_-]?token|refresh[_-]?token|api[_-]?token)/iu;
const SESSION_STORAGE_PATH = "core/session/session-storage.ts";
const LEGACY_SESSION_WRITE_PATTERNS = [
  /SecureStore\.setItemAsync\(\s*LEGACY_ACCESS_TOKEN_KEY\b/u,
  /SecureStore\.setItemAsync\(\s*LEGACY_USER_EMAIL_KEY\b/u,
  /SecureStore\.setItemAsync\(\s*["']auraxis\.access-token["']/u,
  /SecureStore\.setItemAsync\(\s*["']auraxis\.user-email["']/u,
];

const walkDirectoryRecursively = (rootDirectory) => {
  const visitedFiles = [];

  if (!fs.existsSync(rootDirectory)) {
    return visitedFiles;
  }

  const stack = [rootDirectory];

  while (stack.length > 0) {
    const currentDirectory = stack.pop();
    const entries = fs.readdirSync(currentDirectory, { withFileTypes: true });

    for (const entry of entries) {
      if (
        entry.name === "node_modules"
        || entry.name === "coverage"
        || entry.name === ".expo"
        || entry.name === ".git"
      ) {
        continue;
      }

      const absoluteEntryPath = path.join(currentDirectory, entry.name);

      if (entry.isDirectory()) {
        stack.push(absoluteEntryPath);
        continue;
      }

      visitedFiles.push(absoluteEntryPath);
    }
  }

  return visitedFiles;
};

const toUnixRelativePath = (absolutePath, rootDirectory = ROOT) => {
  return path.relative(rootDirectory, absolutePath).split(path.sep).join("/");
};

const collectProductCodeFiles = (rootDirectory = ROOT) => {
  return PRODUCT_DIRECTORIES.flatMap((directory) => {
    const absoluteDirectory = path.resolve(rootDirectory, directory);
    const files = walkDirectoryRecursively(absoluteDirectory);

    return files.filter((absoluteFilePath) => {
      const relativePath = toUnixRelativePath(absoluteFilePath, rootDirectory);
      return (
        CODE_EXTENSIONS.has(path.extname(absoluteFilePath))
        && !CODE_FILE_EXCLUDE_PATTERNS.some((pattern) => pattern.test(relativePath))
      );
    });
  });
};

const findLineViolations = ({ relativePath, fileContent }, predicate, messageBuilder) => {
  const lines = fileContent.split("\n");
  const errors = [];

  lines.forEach((lineContent, lineIndex) => {
    const detail = predicate(lineContent);
    if (!detail) {
      return;
    }

    errors.push(messageBuilder({
      relativePath,
      lineNumber: lineIndex + 1,
      detail,
    }));
  });

  return errors;
};

const findBannedEnvLiteralViolations = (files) => {
  return files.flatMap(({ relativePath, fileContent }) => {
    return findLineViolations(
      { relativePath, fileContent },
      (lineContent) => {
        const key = BANNED_ENV_LITERAL_KEYS.find((candidate) => {
          return lineContent.includes(candidate);
        });
        return key ?? null;
      },
      ({ relativePath: nextRelativePath, lineNumber, detail }) => {
        return `banned client env key reference (${detail}): ${nextRelativePath}:${lineNumber}`;
      },
    );
  });
};

const findSensitiveProcessEnvViolations = (files) => {
  return files.flatMap(({ relativePath, fileContent }) => {
    return findLineViolations(
      { relativePath, fileContent },
      (lineContent) => {
        const match = lineContent.match(SENSITIVE_PROCESS_ENV_PATTERN);
        return match?.[1] ?? null;
      },
      ({ relativePath: nextRelativePath, lineNumber, detail }) => {
        return `sensitive process.env reference in client code (${detail}): ${nextRelativePath}:${lineNumber}`;
      },
    );
  });
};

const visitObjectKeys = (value, prefix = "") => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return [];
  }

  return Object.entries(value).flatMap(([key, nestedValue]) => {
    const nextPath = prefix.length > 0 ? `${prefix}.${key}` : key;
    return [nextPath, ...visitObjectKeys(nestedValue, nextPath)];
  });
};

const findSensitiveAppConfigExtraViolations = (appConfig) => {
  const extra = appConfig?.expo?.extra ?? {};

  return visitObjectKeys(extra)
    .filter((keyPath) => SENSITIVE_APP_CONFIG_EXTRA_KEY_PATTERN.test(keyPath))
    .map((keyPath) => {
      return `sensitive expo.extra key detected in app.json (${keyPath})`;
    });
};

const findLegacySessionPersistenceViolations = (sessionStorageContents) => {
  return LEGACY_SESSION_WRITE_PATTERNS.flatMap((pattern) => {
    return pattern.test(sessionStorageContents)
      ? ["legacy session keys must not be written back to SecureStore"]
      : [];
  });
};

const loadInputs = (rootDirectory = ROOT) => {
  const codeFiles = collectProductCodeFiles(rootDirectory).map((absolutePath) => {
    return {
      relativePath: toUnixRelativePath(absolutePath, rootDirectory),
      fileContent: fs.readFileSync(absolutePath, "utf8"),
    };
  });
  const appConfig = JSON.parse(
    fs.readFileSync(path.resolve(rootDirectory, "app.json"), "utf8"),
  );
  const sessionStorageContents = fs.readFileSync(
    path.resolve(rootDirectory, SESSION_STORAGE_PATH),
    "utf8",
  );

  return {
    appConfig,
    codeFiles,
    sessionStorageContents,
  };
};

const run = () => {
  const { appConfig, codeFiles, sessionStorageContents } = loadInputs();
  const errors = [
    ...findBannedEnvLiteralViolations(codeFiles),
    ...findSensitiveProcessEnvViolations(codeFiles),
    ...findSensitiveAppConfigExtraViolations(appConfig),
    ...findLegacySessionPersistenceViolations(sessionStorageContents),
  ];

  if (errors.length > 0) {
    process.stderr.write("[client-security-governance] FAILED\n");
    for (const error of errors) {
      process.stderr.write(` - ${error}\n`);
    }
    process.exit(1);
  }

  process.stdout.write("[client-security-governance] OK\n");
};

if (require.main === module) {
  run();
}

module.exports = {
  BANNED_ENV_LITERAL_KEYS,
  findBannedEnvLiteralViolations,
  findLegacySessionPersistenceViolations,
  findSensitiveAppConfigExtraViolations,
  findSensitiveProcessEnvViolations,
  loadInputs,
  run,
};
