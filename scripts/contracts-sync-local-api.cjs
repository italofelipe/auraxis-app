#!/usr/bin/env node

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const APP_REPO_ROOT = process.cwd();
const DEFAULT_API_REPO_ROOT = path.resolve(APP_REPO_ROOT, "..", "auraxis-api");
const API_REPO_ROOT =
  process.env.AURAXIS_API_REPO_ROOT ?? DEFAULT_API_REPO_ROOT;
const API_VENV_DIR =
  process.env.AURAXIS_API_VENV_DIR ?? path.resolve(API_REPO_ROOT, ".venv");
const API_REPO_BIN = path.resolve(API_REPO_ROOT, "scripts", "repo_bin.sh");
const TEMP_OPENAPI_FILE = path.resolve(
  os.tmpdir(),
  `auraxis-app-openapi-local-${Date.now()}.json`,
);
const TEMP_SQLITE_DB = path.resolve(
  os.tmpdir(),
  "auraxis-app-contracts-sync.sqlite3",
);

const EXPORT_CODE = `
import json
import sys

from app import create_app

app = create_app()

with app.test_client() as client:
    response = client.get("/docs/swagger/")
    if response.status_code != 200:
        raise SystemExit(
            f"[contracts:sync:api-local] failed to export openapi: {response.status_code}"
        )
    with open(sys.argv[1], "w", encoding="utf-8") as target:
        json.dump(response.get_json(), target, ensure_ascii=False, indent=2)
`.trim();

const ensureApiRepoExists = () => {
  if (!fs.existsSync(API_REPO_ROOT)) {
    throw new Error(
      `auraxis-api repo not found at ${API_REPO_ROOT}. Set AURAXIS_API_REPO_ROOT if needed.`,
    );
  }

  if (!fs.existsSync(API_REPO_BIN)) {
    throw new Error(`missing repo helper: ${API_REPO_BIN}`);
  }
};

const exportOpenApiFromLocalApi = () => {
  ensureApiRepoExists();

  execFileSync(
    API_REPO_BIN,
    ["python", "-c", EXPORT_CODE, TEMP_OPENAPI_FILE],
    {
      cwd: API_REPO_ROOT,
      stdio: "inherit",
      env: {
        ...process.env,
        FLASK_DEBUG: "true",
        DOCS_EXPOSURE_POLICY: "public",
        DATABASE_URL: `sqlite:///${TEMP_SQLITE_DB}`,
        VENV_DIR: API_VENV_DIR,
      },
    },
  );
};

const runContractsSync = () => {
  execFileSync(process.execPath, [path.resolve(APP_REPO_ROOT, "scripts", "contracts-sync.cjs")], {
    cwd: APP_REPO_ROOT,
    stdio: "inherit",
    env: {
      ...process.env,
      AURAXIS_OPENAPI_LOCAL_FILE: TEMP_OPENAPI_FILE,
    },
  });
};

const cleanup = () => {
  fs.rmSync(TEMP_OPENAPI_FILE, { force: true });
  fs.rmSync(TEMP_SQLITE_DB, { force: true });
};

try {
  exportOpenApiFromLocalApi();
  runContractsSync();
} catch (error) {
  process.stderr.write(
    `[contracts:sync:api-local] FAILED: ${error instanceof Error ? error.message : String(error)}\n`,
  );
  process.exitCode = 1;
} finally {
  cleanup();
}
