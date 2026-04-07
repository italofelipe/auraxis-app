#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const ROOT = process.cwd();
const APP_DIRECTORY = path.resolve(ROOT, "app");
const ROUTE_FILE_PATTERN = /\.tsx$/;
const TEMPORARY_ALLOWLIST = new Set();
const LEGACY_IMPORT_PATTERN =
  /from\s+["']@\/(?:components|hooks|lib|stores)\//;

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
      if (entry.name === "node_modules" || entry.name === ".expo" || entry.name === ".git") {
        continue;
      }

      const absolutePath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(absolutePath);
        continue;
      }

      if (ROUTE_FILE_PATTERN.test(absolutePath)) {
        files.push(absolutePath);
      }
    }
  }

  return files;
};

const toRelative = (absolutePath) =>
  path.relative(ROOT, absolutePath).split(path.sep).join("/");

const main = () => {
  const errors = [];

  for (const filePath of walk(APP_DIRECTORY)) {
    const relativePath = toRelative(filePath);

    if (TEMPORARY_ALLOWLIST.has(relativePath)) {
      continue;
    }

    const contents = fs.readFileSync(filePath, "utf8");
    const lines = contents.split("\n");

    lines.forEach((line, index) => {
      if (LEGACY_IMPORT_PATTERN.test(line)) {
        errors.push(`legacy route import detected: ${relativePath}:${index + 1}`);
      }
    });
  }

  if (errors.length > 0) {
    process.stderr.write("[app-route-boundaries] FAILED\n");
    for (const error of errors) {
      process.stderr.write(` - ${error}\n`);
    }
    process.exit(1);
  }

  process.stdout.write("[app-route-boundaries] OK\n");
};

main();
