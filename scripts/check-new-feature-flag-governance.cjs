#!/usr/bin/env node
/**
 * check-new-feature-flag-governance.cjs
 *
 * Governance script: detects feature domains in features/ that do not have
 * a corresponding entry in config/feature-flags.json.
 *
 * Some features are always-on (infrastructure, auth, legal) and are exempt.
 * All other feature domains should have a flag entry to support controlled
 * rollout, kill-switch capability, and experiment tracking.
 *
 * Usage:
 *   node scripts/check-new-feature-flag-governance.cjs
 *   node scripts/check-new-feature-flag-governance.cjs --strict   # exit 1 on warnings
 *
 * Closes #377
 */

"use strict";

const fs = require("node:fs");
const path = require("node:path");

// Feature domains that are always-on (infrastructure / bootstrapping).
// These do not require a feature flag entry.
const ALWAYS_ON = new Set([
  "auth",
  "bootstrap",
  "shared-entries",
  "observability",
  "legal",
  "onboarding",
]);

const FLAGS_FILE = path.join(__dirname, "..", "config", "feature-flags.json");
const FEATURES_DIR = path.join(__dirname, "..", "features");

function loadFlagKeys(flagsFile) {
  const raw = fs.readFileSync(flagsFile, "utf8");
  const parsed = JSON.parse(raw);

  if (!parsed || !Array.isArray(parsed.flags)) {
    throw new Error("config/feature-flags.json must contain a top-level 'flags' array");
  }

  return parsed.flags.map((f) => (typeof f.key === "string" ? f.key.trim() : ""));
}

function listFeatureDomains(featuresDir) {
  return fs
    .readdirSync(featuresDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
}

/**
 * Resolve a feature domain name to candidate flag key segments.
 * A flag like "app.transactions" matches the "transactions" domain.
 * A flag like "app.wallet.live-quotes" also matches the "wallet" domain.
 */
function domainHasFlag(domain, flagKeys) {
  const normalizedDomain = domain.replace(/-/g, ".");
  return flagKeys.some((key) => {
    const parts = key.split(".");
    // Match if any segment of the flag key equals the domain (normalized)
    return parts.some((part) => part === normalizedDomain || part === domain);
  });
}

function main() {
  const isStrict = process.argv.includes("--strict");

  let flagKeys;
  try {
    flagKeys = loadFlagKeys(FLAGS_FILE);
  } catch (error) {
    process.stderr.write(
      `[feature-flag-governance] ERROR: could not read flag catalog: ${error.message}\n`,
    );
    process.exit(1);
  }

  let domains;
  try {
    domains = listFeatureDomains(FEATURES_DIR);
  } catch (error) {
    process.stderr.write(
      `[feature-flag-governance] ERROR: could not list features/: ${error.message}\n`,
    );
    process.exit(1);
  }

  const missing = [];
  for (const domain of domains) {
    if (ALWAYS_ON.has(domain)) {
      continue;
    }
    if (!domainHasFlag(domain, flagKeys)) {
      missing.push(domain);
    }
  }

  if (missing.length > 0) {
    process.stderr.write(
      `[feature-flag-governance] WARNING: feature domains without a flag entry:\n`,
    );
    for (const domain of missing) {
      process.stderr.write(`  - ${domain}\n`);
    }
    process.stderr.write(
      `\n  Add entries to config/feature-flags.json or add the domain to ALWAYS_ON\n` +
      `  in scripts/check-new-feature-flag-governance.cjs if it is infrastructure-level.\n\n`,
    );

    if (isStrict) {
      process.stderr.write(
        `[feature-flag-governance] FAILED (--strict mode, ${missing.length} missing)\n`,
      );
      process.exit(1);
    }

    process.stdout.write(
      `[feature-flag-governance] OK (warnings only, ${missing.length} domains without flags)\n`,
    );
    return;
  }

  process.stdout.write(
    `[feature-flag-governance] OK — all ${domains.length - ALWAYS_ON.size} non-exempt feature domains have a flag entry\n`,
  );
}

main();
