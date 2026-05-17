#!/usr/bin/env node

const childProcess = require("node:child_process");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");

const GOVERNANCE_CHECKS = [
  {
    id: "frontend",
    label: "Frontend boundaries",
    script: "scripts/check-frontend-governance.cjs",
  },
  {
    id: "api-contract",
    label: "API contract boundaries",
    script: "scripts/check-api-contract-governance.cjs",
  },
  {
    id: "app-routes",
    label: "App route boundaries",
    script: "scripts/check-app-route-boundaries.cjs",
  },
  {
    id: "openapi-secret-hygiene",
    label: "OpenAPI secret hygiene",
    script: "scripts/check-openapi-secret-hygiene.cjs",
  },
  {
    id: "sonar-config",
    label: "Sonar configuration",
    script: "scripts/check-sonar-config-governance.cjs",
  },
  {
    id: "runtime-release",
    label: "Runtime and release readiness",
    script: "scripts/check-runtime-release-governance.cjs",
  },
  {
    id: "client-security",
    label: "Client security",
    script: "scripts/check-client-security-governance.cjs",
  },
  {
    id: "client-logging",
    label: "Client logging",
    script: "scripts/check-client-logging-governance.cjs",
  },
  {
    id: "new-feature-flags",
    label: "New feature flag coverage",
    script: "scripts/check-new-feature-flag-governance.cjs",
  },
];

const defaultRunner = (check, { rootDirectory }) => {
  return childProcess.spawnSync(
    process.execPath,
    [path.resolve(rootDirectory, check.script)],
    {
      cwd: rootDirectory,
      encoding: "utf8",
      env: process.env,
    },
  );
};

const resolveExitCode = (execution) => {
  if (typeof execution.status === "number") {
    return execution.status;
  }

  return 1;
};

const runGovernanceChecks = ({
  checks = GOVERNANCE_CHECKS,
  runner = defaultRunner,
  rootDirectory = ROOT,
  stdout = null,
  stderr = null,
} = {}) => {
  const results = checks.map((check) => {
    if (stdout) {
      stdout.write(`[governance:all] running ${check.id}: ${check.label}\n`);
    }

    const execution = runner(check, { rootDirectory });
    const exitCode = resolveExitCode(execution);
    const output = execution.stdout ?? "";
    const errorOutput = [
      execution.stderr ?? "",
      execution.error?.message ? `${execution.error.message}\n` : "",
    ].join("");

    if (stdout && output.length > 0) {
      stdout.write(output);
    }

    if (stderr && errorOutput.length > 0) {
      stderr.write(errorOutput);
    }

    return {
      id: check.id,
      label: check.label,
      status: exitCode === 0 ? "passed" : "failed",
      exitCode,
      stdout: output,
      stderr: errorOutput,
    };
  });

  return {
    exitCode: results.some((result) => result.status === "failed") ? 1 : 0,
    results,
  };
};

const formatSummary = (results) => {
  const failed = results.filter((result) => result.status === "failed");
  const passed = results.filter((result) => result.status === "passed");
  const headline = failed.length > 0
    ? `[governance:all] FAILED (${failed.length} failed, ${passed.length} passed)`
    : `[governance:all] OK (${passed.length} passed)`;

  const lines = [...failed, ...passed].map((result) => {
    if (result.status === "failed") {
      return ` - FAIL ${result.id}: ${result.label} (exit ${result.exitCode})`;
    }

    return ` - PASS ${result.id}: ${result.label}`;
  });

  return [headline, ...lines].join("\n");
};

const run = () => {
  const { exitCode, results } = runGovernanceChecks({
    stdout: process.stdout,
    stderr: process.stderr,
  });

  process.stdout.write(`${formatSummary(results)}\n`);
  process.exit(exitCode);
};

if (require.main === module) {
  run();
}

module.exports = {
  GOVERNANCE_CHECKS,
  formatSummary,
  run,
  runGovernanceChecks,
};
