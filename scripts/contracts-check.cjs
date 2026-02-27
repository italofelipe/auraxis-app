#!/usr/bin/env node

const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const {
  CONTRACT_BASELINE_PATH,
  CONTRACTS_API_URL,
  GENERATED_TYPES_PATH,
  OPENAPI_SNAPSHOT_PATH,
} = require("./contracts.config.cjs");
const {
  listRemoteContractPacks,
  readJsonFile,
  sha256,
  validateRestEndpointsAgainstOpenApi,
} = require("./contracts.utils.cjs");

const ensureFileExists = (filePath) => {
  if (!fs.existsSync(filePath)) {
    throw new Error(`required file not found: ${filePath}`);
  }
};

const runOpenApiGeneratedDiffCheck = () => {
  const temporaryOutputFile = path.resolve(
    os.tmpdir(),
    `auraxis-app-openapi-${Date.now()}.ts`,
  );

  const npxCommand = process.platform === "win32" ? "npx.cmd" : "npx";
  execFileSync(
    npxCommand,
    ["openapi-typescript", OPENAPI_SNAPSHOT_PATH, "--output", temporaryOutputFile],
    { stdio: "ignore" },
  );

  const committedTypes = fs.readFileSync(GENERATED_TYPES_PATH, "utf8");
  const generatedTypes = fs.readFileSync(temporaryOutputFile, "utf8");
  fs.unlinkSync(temporaryOutputFile);

  if (committedTypes !== generatedTypes) {
    throw new Error(
      "generated OpenAPI types are outdated. Run `npm run contracts:sync`.",
    );
  }
};

const validateContractPackBaseline = (remotePacks, baselinePayload) => {
  const baselineEntries = Array.isArray(baselinePayload?.packs)
    ? baselinePayload.packs
    : [];
  const baselineMap = new Map();

  for (const entry of baselineEntries) {
    const taskId = String(entry?.taskId ?? "").trim();
    const hash = String(entry?.sha256 ?? "").trim();
    if (taskId.length > 0 && hash.length > 0) {
      baselineMap.set(taskId, hash);
    }
  }

  const errors = [];

  for (const pack of remotePacks) {
    const baselineHash = baselineMap.get(pack.taskId);
    if (!baselineHash) {
      errors.push(
        `missing contract pack baseline for ${pack.taskId}. Run \`npm run contracts:sync\`.`,
      );
      continue;
    }

    if (baselineHash !== pack.hash) {
      errors.push(
        `contract pack changed for ${pack.taskId}. Run \`npm run contracts:sync\`.`,
      );
    }
  }

  return errors;
};

const run = async () => {
  ensureFileExists(OPENAPI_SNAPSHOT_PATH);
  ensureFileExists(GENERATED_TYPES_PATH);
  ensureFileExists(CONTRACT_BASELINE_PATH);

  runOpenApiGeneratedDiffCheck();

  const openApiDocument = readJsonFile(OPENAPI_SNAPSHOT_PATH);
  const baselinePayload = readJsonFile(CONTRACT_BASELINE_PATH);

  const skipRemoteCheck =
    String(process.env.AURAXIS_SKIP_REMOTE_CONTRACT_CHECK ?? "").toLowerCase()
    === "true";

  if (skipRemoteCheck) {
    process.stdout.write(
      "[contracts:check] remote contract check skipped by AURAXIS_SKIP_REMOTE_CONTRACT_CHECK=true\n",
    );
    return;
  }

  const remotePacks = await listRemoteContractPacks(CONTRACTS_API_URL);
  const baselineErrors = validateContractPackBaseline(remotePacks, baselinePayload);
  const openApiErrors = validateRestEndpointsAgainstOpenApi(
    openApiDocument,
    remotePacks,
  );
  const allErrors = [...baselineErrors, ...openApiErrors];

  if (allErrors.length > 0) {
    process.stderr.write("[contracts:check] FAILED\n");
    for (const error of allErrors) {
      process.stderr.write(` - ${error}\n`);
    }
    process.exit(1);
  }

  const openApiHash = sha256(JSON.stringify(openApiDocument));
  process.stdout.write(
    `[contracts:check] OK (packs=${remotePacks.length}, openapi_hash=${openApiHash.slice(0, 12)})\n`,
  );
};

run().catch((error) => {
  process.stderr.write(`[contracts:check] FAILED: ${error.message}\n`);
  process.exit(1);
});
