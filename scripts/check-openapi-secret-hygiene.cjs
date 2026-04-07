#!/usr/bin/env node

const fs = require("node:fs");

const {
  GENERATED_TYPES_PATH,
  OPENAPI_SNAPSHOT_PATH,
} = require("./contracts.config.cjs");
const {
  findUnsafeGeneratedTypeExamples,
  findUnsafeOpenApiExamples,
} = require("./openapi-secret-hygiene.cjs");
const { readJsonFile } = require("./contracts.utils.cjs");

const run = () => {
  const openApiDocument = readJsonFile(OPENAPI_SNAPSHOT_PATH);
  const openApiFindings = findUnsafeOpenApiExamples(openApiDocument);
  const generatedTypesText = fs.readFileSync(GENERATED_TYPES_PATH, "utf8");
  const generatedTypeFindings = findUnsafeGeneratedTypeExamples(generatedTypesText);

  if (openApiFindings.length === 0 && generatedTypeFindings.length === 0) {
    process.stdout.write("[openapi-secret-hygiene] OK\n");
    return;
  }

  process.stderr.write("[openapi-secret-hygiene] FAILED\n");

  for (const finding of openApiFindings.slice(0, 20)) {
    process.stderr.write(
      ` - openapi: ${finding.path} => ${JSON.stringify(finding.original)}\n`,
    );
  }

  for (const finding of generatedTypeFindings.slice(0, 20)) {
    process.stderr.write(
      ` - generated: ${finding.label} at index ${finding.index}\n`,
    );
  }

  process.stderr.write(
    "Run `npm run contracts:sync` or `npm run contracts:sync:api-local` after sanitizing contract examples.\n",
  );
  process.exit(1);
};

try {
  run();
} catch (error) {
  process.stderr.write(
    `[openapi-secret-hygiene] FAILED: ${error instanceof Error ? error.message : String(error)}\n`,
  );
  process.exit(1);
}
