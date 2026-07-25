#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const SOURCE_DIRECTORIES = ["app", "core", "features", "shared"];
const SOURCE_EXTENSION = /\.(?:ts|tsx)$/;
const TEST_FILE = /\.(?:test|spec)\.(?:ts|tsx)$/;
const DIRECT_DEPTH_PATTERN =
  /\b(?:shadowColor|shadowOffset|shadowOpacity|shadowRadius|elevation)\s*[:=]/;

/**
 * Only structural controls and deliberate decorative surfaces may own direct
 * native depth. Content cards must use semanticShadows/AppSurfaceCard.
 */
const AUTHORIZED_DIRECT_DEPTH_FILES = new Set([
  "core/navigation/app-tab-bar.tsx",
  "features/auth/screens/login-screen.tsx",
  "features/dashboard/components/dashboard-quick-add-fab.tsx",
  "shared/coach-marks/coach-tooltip.tsx",
]);

const toUnixPath = (value) => value.split(path.sep).join("/");

const walk = (directory) => {
  if (!fs.existsSync(directory)) {
    return [];
  }
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      return walk(entryPath);
    }
    return [entryPath];
  });
};

const findDirectDepthViolations = (
  rootDirectory,
  {
    sourceDirectories = SOURCE_DIRECTORIES,
    authorizedFiles = AUTHORIZED_DIRECT_DEPTH_FILES,
  } = {},
) => {
  const violations = [];

  for (const sourceDirectory of sourceDirectories) {
    const files = walk(path.join(rootDirectory, sourceDirectory));
    for (const absoluteFile of files) {
      const relativeFile = toUnixPath(path.relative(rootDirectory, absoluteFile));
      if (
        !SOURCE_EXTENSION.test(relativeFile)
        || TEST_FILE.test(relativeFile)
        || relativeFile.startsWith("shared/theme/")
        || authorizedFiles.has(relativeFile)
      ) {
        continue;
      }

      const lines = fs.readFileSync(absoluteFile, "utf8").split("\n");
      lines.forEach((line, index) => {
        if (DIRECT_DEPTH_PATTERN.test(line)) {
          violations.push(
            `direct shadow/elevation outside an authorized component: ${relativeFile}:${index + 1}`,
          );
        }
      });
    }
  }

  return violations;
};

const main = () => {
  const violations = findDirectDepthViolations(process.cwd());
  if (violations.length > 0) {
    process.stderr.write("[visual-surface-governance] FAILED\n");
    violations.forEach((violation) => {
      process.stderr.write(` - ${violation}\n`);
    });
    process.exit(1);
  }
  process.stdout.write("[visual-surface-governance] OK\n");
};

if (require.main === module) {
  main();
}

module.exports = {
  AUTHORIZED_DIRECT_DEPTH_FILES,
  findDirectDepthViolations,
};
