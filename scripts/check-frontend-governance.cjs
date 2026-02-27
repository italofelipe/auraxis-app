#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const PRODUCT_DIRECTORIES = [
  "app",
  "components",
  "hooks",
  "lib",
  "stores",
  "schemas",
  "shared",
  "types",
];
const REQUIRED_SHARED_DIRECTORIES = [
  "shared/components",
  "shared/types",
  "shared/validators",
  "shared/utils",
];
const DISALLOWED_SOURCE_EXTENSIONS = new Set([".js", ".jsx", ".cjs", ".mjs"]);
const DISALLOWED_SOURCE_PATTERNS = [
  /^app\/.*\.(js|jsx|cjs|mjs)$/,
  /^components\/.*\.(js|jsx|cjs|mjs)$/,
  /^hooks\/.*\.(js|jsx|cjs|mjs)$/,
  /^lib\/.*\.(js|jsx|cjs|mjs)$/,
  /^stores\/.*\.(js|jsx|cjs|mjs)$/,
  /^schemas\/.*\.(js|jsx|cjs|mjs)$/,
  /^shared\/.*\.(js|jsx|cjs|mjs)$/,
  /^types\/.*\.(js|jsx|cjs|mjs)$/,
];
const STYLE_SCAN_EXTENSIONS = new Set([".ts", ".tsx"]);
const STYLE_TOKEN_EXCLUDE_PATTERNS = [
  /^config\/design-tokens\.ts$/,
  /^config\/paper-theme\.ts$/,
  /^constants\/theme\.ts$/,
  /^shared\/theme\/.+/,
  /^shared\/tokens\/.+/,
  /^components\/hello-wave\.tsx$/,
  /^components\/parallax-scroll-view\.tsx$/,
  /^components\/themed-text\.tsx$/,
  /^components\/themed-view\.tsx$/,
  /^components\/ui\/loading-skeleton\.tsx$/,
  /^.+\.test\.tsx?$/,
];
const DISALLOWED_STYLE_LITERALS = [
  {
    rule: "literal fontSize outside tokens",
    pattern: /\bfontSize\s*:\s*\d+(?:\.\d+)?\b/,
  },
  {
    rule: "literal fontWeight outside tokens",
    pattern: /\bfontWeight\s*:\s*['"]?[1-9]00['"]?\b/,
  },
  {
    rule: "literal lineHeight outside tokens",
    pattern: /\blineHeight\s*:\s*\d+(?:\.\d+)?\b/,
  },
  {
    rule: "literal borderRadius outside tokens",
    pattern: /\bborderRadius\s*:\s*\d+(?:\.\d+)?\b/,
  },
  {
    rule: "literal borderWidth outside tokens",
    pattern: /\bborderWidth\s*:\s*\d+(?:\.\d+)?\b/,
  },
  {
    rule: "literal spacing outside tokens",
    pattern: /\b(?:padding|paddingTop|paddingBottom|paddingLeft|paddingRight|paddingHorizontal|paddingVertical|margin|marginTop|marginBottom|marginLeft|marginRight|marginHorizontal|marginVertical|gap)\s*:\s*\d+(?:\.\d+)?\b/,
  },
  {
    rule: "literal color outside tokens",
    pattern: /\b(?:color|backgroundColor|borderColor)\s*:\s*['"]#[0-9a-fA-F]{3,8}['"]\b/,
  },
];

function walkDirectoryRecursively(rootDirectory) {
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
}

function toUnixRelativePath(absolutePath, rootDirectory) {
  const relativePath = path.relative(rootDirectory, absolutePath);
  return relativePath.split(path.sep).join("/");
}

function assertRequiredSharedDirectoriesExist(errors, rootDirectory) {
  for (const relativeDirectory of REQUIRED_SHARED_DIRECTORIES) {
    const absoluteDirectory = path.resolve(rootDirectory, relativeDirectory);

    if (!fs.existsSync(absoluteDirectory) || !fs.statSync(absoluteDirectory).isDirectory()) {
      errors.push(`missing required shared directory: ${relativeDirectory}`);
    }
  }
}

function checkDisallowedSourceExtensions(errors, rootDirectory) {
  for (const productDirectory of PRODUCT_DIRECTORIES) {
    const absoluteProductDirectory = path.resolve(rootDirectory, productDirectory);
    const files = walkDirectoryRecursively(absoluteProductDirectory);

    for (const filePath of files) {
      const relativePath = toUnixRelativePath(filePath, rootDirectory);
      const extension = path.extname(relativePath);

      if (!DISALLOWED_SOURCE_EXTENSIONS.has(extension)) {
        continue;
      }

      const isDisallowedByPattern = DISALLOWED_SOURCE_PATTERNS.some((pattern) => {
        return pattern.test(relativePath);
      });

      if (isDisallowedByPattern) {
        errors.push(`disallowed product source extension detected: ${relativePath}`);
      }
    }
  }
}

function checkDisallowedStyleLiterals(errors, rootDirectory) {
  for (const productDirectory of PRODUCT_DIRECTORIES) {
    const absoluteProductDirectory = path.resolve(rootDirectory, productDirectory);
    const files = walkDirectoryRecursively(absoluteProductDirectory);

    for (const absoluteFilePath of files) {
      const relativePath = toUnixRelativePath(absoluteFilePath, rootDirectory);
      const extension = path.extname(relativePath);

      if (!STYLE_SCAN_EXTENSIONS.has(extension)) {
        continue;
      }

      const isExcluded = STYLE_TOKEN_EXCLUDE_PATTERNS.some((pattern) => {
        return pattern.test(relativePath);
      });
      if (isExcluded) {
        continue;
      }

      const fileContent = fs.readFileSync(absoluteFilePath, "utf8");
      const fileLines = fileContent.split("\n");

      fileLines.forEach((lineContent, lineIndex) => {
        for (const styleRule of DISALLOWED_STYLE_LITERALS) {
          if (styleRule.pattern.test(lineContent)) {
            errors.push(
              `${styleRule.rule}: ${relativePath}:${lineIndex + 1}`,
            );
          }
        }
      });
    }
  }
}

function main() {
  const rootDirectory = process.cwd();
  const errors = [];

  assertRequiredSharedDirectoriesExist(errors, rootDirectory);
  checkDisallowedSourceExtensions(errors, rootDirectory);
  checkDisallowedStyleLiterals(errors, rootDirectory);

  if (errors.length > 0) {
    process.stderr.write("[frontend-governance] FAILED\n");

    for (const error of errors) {
      process.stderr.write(` - ${error}\n`);
    }

    process.exit(1);
  }

  process.stdout.write("[frontend-governance] OK\n");
}

main();
