#!/usr/bin/env node

const path = require("node:path");

const PLATFORM_OWNER = process.env.AURAXIS_PLATFORM_OWNER ?? "italofelipe";
const PLATFORM_REPO = process.env.AURAXIS_PLATFORM_REPO ?? "auraxis-platform";
const PLATFORM_REF = process.env.AURAXIS_PLATFORM_REF ?? "master";

const DEFAULT_CONTRACTS_API_URL = `https://api.github.com/repos/${PLATFORM_OWNER}/${PLATFORM_REPO}/contents/.context/feature_contracts?ref=${PLATFORM_REF}`;
const DEFAULT_OPENAPI_SNAPSHOT_URL = `https://raw.githubusercontent.com/${PLATFORM_OWNER}/${PLATFORM_REPO}/${PLATFORM_REF}/.context/openapi/openapi.snapshot.json`;

const CONTRACTS_API_URL =
  process.env.AURAXIS_CONTRACTS_API_URL ?? DEFAULT_CONTRACTS_API_URL;
const OPENAPI_SNAPSHOT_URL =
  process.env.AURAXIS_OPENAPI_SNAPSHOT_URL ?? DEFAULT_OPENAPI_SNAPSHOT_URL;

const REPO_ROOT = process.cwd();
const OPENAPI_SNAPSHOT_PATH = path.resolve(
  REPO_ROOT,
  "contracts/openapi.snapshot.json",
);
const CONTRACT_BASELINE_PATH = path.resolve(
  REPO_ROOT,
  "contracts/feature-contract-baseline.json",
);
const GENERATED_TYPES_PATH = path.resolve(
  REPO_ROOT,
  "shared/types/generated/openapi.ts",
);

module.exports = {
  CONTRACTS_API_URL,
  CONTRACT_BASELINE_PATH,
  GENERATED_TYPES_PATH,
  OPENAPI_SNAPSHOT_PATH,
  OPENAPI_SNAPSHOT_URL,
  PLATFORM_OWNER,
  PLATFORM_REF,
  PLATFORM_REPO,
};
