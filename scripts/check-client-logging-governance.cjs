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
const CONSOLE_USAGE_PATTERN = /\bconsole\.(?:log|info|warn|error|debug)\(/u;
const APP_LOGGER_IMPORT_PATTERN =
  /from\s+["']@\/core\/telemetry\/app-logger["']/u;
const ALLOWED_CONSOLE_USAGE_PATHS = new Set([
  "app/services/sentry.ts",
  "core/telemetry/app-logger.ts",
]);
const ALLOWED_APP_LOGGER_IMPORT_PATHS = new Set([
  "core/telemetry/app-logger.ts",
  "core/telemetry/domain-loggers.ts",
]);

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

const findConsoleUsageViolations = (files) => {
  return files.flatMap(({ relativePath, fileContent }) => {
    if (ALLOWED_CONSOLE_USAGE_PATHS.has(relativePath)) {
      return [];
    }

    return findLineViolations(
      { relativePath, fileContent },
      (lineContent) => {
        return CONSOLE_USAGE_PATTERN.test(lineContent)
          ? lineContent.trim()
          : null;
      },
      ({ relativePath: nextRelativePath, lineNumber }) => {
        return `console usage outside canonical logging boundary: ${nextRelativePath}:${lineNumber}`;
      },
    );
  });
};

const findDirectAppLoggerImportViolations = (files) => {
  return files.flatMap(({ relativePath, fileContent }) => {
    if (ALLOWED_APP_LOGGER_IMPORT_PATHS.has(relativePath)) {
      return [];
    }

    return findLineViolations(
      { relativePath, fileContent },
      (lineContent) => {
        return APP_LOGGER_IMPORT_PATTERN.test(lineContent)
          ? lineContent.trim()
          : null;
      },
      ({ relativePath: nextRelativePath, lineNumber }) => {
        return `direct appLogger import outside domain logging boundary: ${nextRelativePath}:${lineNumber}`;
      },
    );
  });
};

const loadInputs = (rootDirectory = ROOT) => {
  return collectProductCodeFiles(rootDirectory).map((absolutePath) => {
    return {
      relativePath: toUnixRelativePath(absolutePath, rootDirectory),
      fileContent: fs.readFileSync(absolutePath, "utf8"),
    };
  });
};

const run = () => {
  const codeFiles = loadInputs();
  const errors = [
    ...findConsoleUsageViolations(codeFiles),
    ...findDirectAppLoggerImportViolations(codeFiles),
  ];

  if (errors.length > 0) {
    process.stderr.write("[client-logging-governance] FAILED\n");
    for (const error of errors) {
      process.stderr.write(` - ${error}\n`);
    }
    process.exit(1);
  }

  process.stdout.write("[client-logging-governance] OK\n");
};

if (require.main === module) {
  run();
}

module.exports = {
  findConsoleUsageViolations,
  findDirectAppLoggerImportViolations,
  loadInputs,
  run,
};
