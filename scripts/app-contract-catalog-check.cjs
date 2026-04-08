#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const ROOT = process.cwd();
const API_CONTRACT_MAP_PATH = path.resolve(
  ROOT,
  "shared/contracts/api-contract-map.ts",
);
const API_ENDPOINT_CATALOG_PATH = path.resolve(
  ROOT,
  "shared/contracts/api-endpoint-catalog.ts",
);
const OPENAPI_SNAPSHOT_PATH = path.resolve(ROOT, "contracts/openapi.snapshot.json");
const KNOWN_GAPS_PATH = path.resolve(ROOT, "contracts/known-openapi-gaps.json");

const CONTRACT_SIGNATURE_PATTERN =
  /defineApiContract<\s*"([A-Z]+)"\s*,\s*"([^"]+)"/gs;
const ENDPOINT_SIGNATURE_PATTERN = /["'`](GET|POST|PUT|PATCH|DELETE) ([^"'`]+)["'`]/g;

const readUtf8 = (filePath) => {
  return fs.readFileSync(filePath, "utf8");
};

const readJson = (filePath) => {
  return JSON.parse(readUtf8(filePath));
};

const extractContractSignatures = (sourceText) => {
  const signatures = [];

  for (const match of sourceText.matchAll(CONTRACT_SIGNATURE_PATTERN)) {
    signatures.push(`${match[1]} ${match[2]}`);
  }

  return signatures;
};

const extractCatalogSignatures = (sourceText) => {
  const signatures = [];

  for (const match of sourceText.matchAll(ENDPOINT_SIGNATURE_PATTERN)) {
    signatures.push(`${match[1]} ${match[2]}`);
  }

  return signatures;
};

const extractOpenApiSignatures = (openApiDocument) => {
  const signatures = [];
  const paths = openApiDocument?.paths ?? {};

  for (const [routePath, methods] of Object.entries(paths)) {
    for (const method of Object.keys(methods ?? {})) {
      signatures.push(`${String(method).toUpperCase()} ${routePath}`);
    }
  }

  return signatures;
};

const validateAppContractCatalog = () => {
  const contractMapText = readUtf8(API_CONTRACT_MAP_PATH);
  const endpointCatalogText = readUtf8(API_ENDPOINT_CATALOG_PATH);
  const openApiDocument = readJson(OPENAPI_SNAPSHOT_PATH);
  const knownGapsPayload = readJson(KNOWN_GAPS_PATH);

  const contractSignatures = extractContractSignatures(contractMapText);
  const catalogSignatures = new Set(extractCatalogSignatures(endpointCatalogText));
  const openApiSignatures = new Set(extractOpenApiSignatures(openApiDocument));
  const knownGaps = new Set(
    Array.isArray(knownGapsPayload?.openApiMissing)
      ? knownGapsPayload.openApiMissing.map(String)
      : [],
  );

  const missingFromCatalog = contractSignatures.filter((signature) => {
    return !catalogSignatures.has(signature);
  });

  const missingFromOpenApi = contractSignatures.filter((signature) => {
    return !openApiSignatures.has(signature) && !knownGaps.has(signature);
  });

  const staleKnownGaps = [...knownGaps].filter((signature) => {
    return openApiSignatures.has(signature) || !contractSignatures.includes(signature);
  });

  return {
    missingFromCatalog,
    missingFromOpenApi,
    staleKnownGaps,
  };
};

const main = () => {
  const result = validateAppContractCatalog();
  const hasErrors =
    result.missingFromCatalog.length > 0
    || result.missingFromOpenApi.length > 0
    || result.staleKnownGaps.length > 0;

  if (hasErrors) {
    process.stderr.write("[app-contract-catalog] FAILED\n");

    for (const signature of result.missingFromCatalog) {
      process.stderr.write(` - missing from endpoint catalog: ${signature}\n`);
    }

    for (const signature of result.missingFromOpenApi) {
      process.stderr.write(` - missing from OpenAPI and known gaps: ${signature}\n`);
    }

    for (const signature of result.staleKnownGaps) {
      process.stderr.write(` - stale known OpenAPI gap: ${signature}\n`);
    }

    process.exit(1);
  }

  process.stdout.write("[app-contract-catalog] OK\n");
};

if (require.main === module) {
  main();
}

module.exports = {
  validateAppContractCatalog,
};
