#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const ROOT = process.cwd();
const SONAR_CONFIG_PATH = path.resolve(ROOT, "sonar-project.properties");
const JEST_CONFIG_PATH = path.resolve(ROOT, "jest.config.js");

const parseProperties = (rawText) => {
  const result = {};

  for (const rawLine of rawText.split(/\r?\n/u)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();
    result[key] = value;
  }

  return result;
};

const parseCsv = (value) => {
  return String(value ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
};

const isGlobPattern = (value) => /[*?[\]{}]/u.test(value);

const main = () => {
  const sonarProperties = parseProperties(fs.readFileSync(SONAR_CONFIG_PATH, "utf8"));
  const jestConfig = require(JEST_CONFIG_PATH);

  const sonarSources = parseCsv(sonarProperties["sonar.sources"]);
  const sonarInclusions = parseCsv(sonarProperties["sonar.inclusions"]).filter(
    (entry) => !isGlobPattern(entry),
  );
  const jestCoverageEntries = (jestConfig.collectCoverageFrom ?? []).filter((entry) => {
    return typeof entry === "string" && !entry.startsWith("!") && !isGlobPattern(entry);
  });

  const missingPaths = [...new Set([...sonarSources, ...sonarInclusions])]
    .filter((entry) => entry !== ".")
    .filter((entry) => !fs.existsSync(path.resolve(ROOT, entry)));

  const expectedSources = ["."];
  const unexpectedSources = sonarSources.filter((entry) => !expectedSources.includes(entry));
  const missingExpectedSources = expectedSources.filter((entry) => !sonarSources.includes(entry));

  const missingInSonar = jestCoverageEntries.filter((entry) => !sonarInclusions.includes(entry));
  const extraInSonar = sonarInclusions.filter((entry) => !jestCoverageEntries.includes(entry));

  const errors = [];

  for (const entry of missingPaths) {
    errors.push(`sonar path does not exist: ${entry}`);
  }
  for (const entry of missingExpectedSources) {
    errors.push(`sonar.sources must include: ${entry}`);
  }
  for (const entry of unexpectedSources) {
    errors.push(`sonar.sources must not include explicit stale path: ${entry}`);
  }
  for (const entry of missingInSonar) {
    errors.push(`jest coverage entry missing from sonar.inclusions: ${entry}`);
  }
  for (const entry of extraInSonar) {
    errors.push(`sonar.inclusions entry missing from jest coverage baseline: ${entry}`);
  }

  if (errors.length > 0) {
    process.stderr.write("[check-sonar-config] FAILED\n");
    for (const error of errors) {
      process.stderr.write(` - ${error}\n`);
    }
    process.exit(1);
  }

  process.stdout.write("[check-sonar-config] OK\n");
};

main();
