#!/usr/bin/env node

const { execFileSync } = require("node:child_process");

const {
  CONTRACT_BASELINE_PATH,
  CONTRACTS_API_URL,
  GENERATED_TYPES_PATH,
  OPENAPI_SNAPSHOT_PATH,
  OPENAPI_SNAPSHOT_URL,
  PLATFORM_OWNER,
  PLATFORM_REF,
  PLATFORM_REPO,
} = require("./contracts.config.cjs");
const {
  computeContractBaseline,
  ensureParentDirectory,
  listRemoteContractPacks,
  readOpenApiFromSource,
  writeJsonFile,
} = require("./contracts.utils.cjs");

const run = async () => {
  const localOpenApiSourcePath = process.env.AURAXIS_OPENAPI_LOCAL_FILE ?? "";
  const openApiDocument = await readOpenApiFromSource(
    OPENAPI_SNAPSHOT_URL,
    localOpenApiSourcePath,
  );

  writeJsonFile(OPENAPI_SNAPSHOT_PATH, openApiDocument);

  const remotePacks = await listRemoteContractPacks(CONTRACTS_API_URL);
  const baselinePayload = computeContractBaseline(
    remotePacks,
    PLATFORM_OWNER,
    PLATFORM_REPO,
    PLATFORM_REF,
  );
  writeJsonFile(CONTRACT_BASELINE_PATH, baselinePayload);

  ensureParentDirectory(GENERATED_TYPES_PATH);
  const npxCommand = process.platform === "win32" ? "npx.cmd" : "npx";
  execFileSync(
    npxCommand,
    ["openapi-typescript", OPENAPI_SNAPSHOT_PATH, "--output", GENERATED_TYPES_PATH],
    { stdio: "inherit" },
  );

  const sourceLabel = localOpenApiSourcePath.length > 0
    ? localOpenApiSourcePath
    : OPENAPI_SNAPSHOT_URL;

  process.stdout.write(
    `[contracts:sync] snapshot=${OPENAPI_SNAPSHOT_PATH}\n`
      + `[contracts:sync] generated=${GENERATED_TYPES_PATH}\n`
      + `[contracts:sync] baseline=${CONTRACT_BASELINE_PATH}\n`
      + `[contracts:sync] remote packs=${remotePacks.length}\n`
      + `[contracts:sync] openapi source=${sourceLabel}\n`,
  );
};

run().catch((error) => {
  process.stderr.write(`[contracts:sync] FAILED: ${error.message}\n`);
  process.exit(1);
});
