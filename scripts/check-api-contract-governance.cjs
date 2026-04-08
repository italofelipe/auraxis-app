#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const ROOT = process.cwd();
const SCAN_DIRECTORIES = [
  "app",
  "components",
  "core",
  "features",
  "hooks",
  "lib",
  "shared",
  "stores",
];
const API_CALL_LITERAL_PATTERN =
  /\.(?:get|post|put|patch|delete)\s*(?:<[^>]+>)?\(\s*["'`](?:\/)(?:auth|dashboard|subscriptions|ops|wallet|goals|alerts|shared-entries|shared_entries|fiscal|transactions|user|entitlements|simulations|tools)\b/;
const LEGACY_API_IMPORT_PATTERN =
  /from\s+["']@\/lib\/(?:auth|dashboard|wallet|alerts|subscription|entitlement|entitlements)-api["']/;
const EXCLUDED_FILE_PATTERNS = [
  /^shared\/contracts\/api-contract-map\.ts$/,
  /^shared\/contracts\/resolve-api-contract-path\.ts$/,
  /^shared\/contracts\/api-endpoint-catalog\.ts$/,
  /^shared\/mocks\/api\/router\.ts$/,
  /^lib\/api\.ts$/,
  /^lib\/secure-storage\.ts$/,
  /^lib\/web-urls\.ts$/,
  /^.+\.(test|spec)\.(ts|tsx)$/,
];

const walk = (directory) => {
  if (!fs.existsSync(directory)) {
    return [];
  }

  const files = [];
  const stack = [directory];

  while (stack.length > 0) {
    const current = stack.pop();
    const entries = fs.readdirSync(current, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.name === "node_modules" || entry.name === ".git" || entry.name === ".expo") {
        continue;
      }

      const absolutePath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(absolutePath);
        continue;
      }

      if (!absolutePath.endsWith(".ts") && !absolutePath.endsWith(".tsx")) {
        continue;
      }

      files.push(absolutePath);
    }
  }

  return files;
};

const toRelative = (absolutePath) =>
  path.relative(ROOT, absolutePath).split(path.sep).join("/");

const isExcluded = (relativePath) =>
  EXCLUDED_FILE_PATTERNS.some((pattern) => pattern.test(relativePath));

const main = () => {
  const errors = [];

  for (const directory of SCAN_DIRECTORIES) {
    const absoluteDirectory = path.resolve(ROOT, directory);
    for (const filePath of walk(absoluteDirectory)) {
      const relativePath = toRelative(filePath);

      if (isExcluded(relativePath)) {
        continue;
      }

      const contents = fs.readFileSync(filePath, "utf8");
      const lines = contents.split("\n");

      lines.forEach((line, index) => {
        if (LEGACY_API_IMPORT_PATTERN.test(line)) {
          errors.push(
            `legacy api import detected: ${relativePath}:${index + 1}`,
          );
        }

        if (API_CALL_LITERAL_PATTERN.test(line)) {
          errors.push(
            `direct API route literal detected: ${relativePath}:${index + 1}`,
          );
        }
      });
    }
  }

  if (errors.length > 0) {
    process.stderr.write("[api-contract-governance] FAILED\n");
    for (const error of errors) {
      process.stderr.write(` - ${error}\n`);
    }
    process.exit(1);
  }

  process.stdout.write("[api-contract-governance] OK\n");
};

main();
