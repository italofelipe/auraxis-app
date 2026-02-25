#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const PLATFORM_PREFIX = "app";
const ALLOWED_TYPES = new Set(["release", "experiment", "kill-switch"]);
const ALLOWED_STATUS = new Set([
  "draft",
  "enabled-dev",
  "enabled-staging",
  "enabled-prod",
  "cleanup-pending",
  "removed",
]);

function addError(errors, message) {
  errors.push(message);
}

function parseIsoDate(payload) {
  const { value, fieldName, key, errors } = payload;

  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    addError(errors, `${key}: field '${fieldName}' must use YYYY-MM-DD`);
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));

  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    addError(errors, `${key}: field '${fieldName}' is not a valid calendar date`);
    return null;
  }

  return parsed;
}

function loadFlags(catalogPath) {
  const raw = fs.readFileSync(catalogPath, "utf8");
  const parsed = JSON.parse(raw);

  if (!parsed || !Array.isArray(parsed.flags)) {
    throw new Error("catalog must contain a top-level 'flags' array");
  }

  return parsed.flags;
}

function getFlagKey(flag, errors) {
  const key = typeof flag.key === "string" ? flag.key.trim() : "";

  if (!key) {
    addError(errors, "invalid flag entry: missing non-empty 'key'");
    return null;
  }

  return key;
}

function validateKeyUniqueness(payload) {
  const { key, prefix, seenKeys, errors } = payload;

  if (!key.startsWith(`${prefix}.`)) {
    addError(errors, `${key}: key must start with '${prefix}.'`);
  }

  if (seenKeys.has(key)) {
    addError(errors, `${key}: duplicate key detected`);
    return;
  }

  seenKeys.add(key);
}

function validateOwnerTypeAndStatus(payload) {
  const { key, flag, errors } = payload;
  const owner = typeof flag.owner === "string" ? flag.owner.trim() : "";
  const type = typeof flag.type === "string" ? flag.type.trim() : "";
  const status = typeof flag.status === "string" ? flag.status.trim() : "";

  if (!owner) {
    addError(errors, `${key}: missing required field 'owner'`);
  }

  if (!ALLOWED_TYPES.has(type)) {
    addError(errors, `${key}: invalid 'type' (${type || "empty"})`);
  }

  if (!ALLOWED_STATUS.has(status)) {
    addError(errors, `${key}: invalid 'status' (${status || "empty"})`);
  }

  return status;
}

function validateDates(payload) {
  const { key, flag, status, todayUtc, errors } = payload;
  const createdAt = parseIsoDate({ value: flag.createdAt, fieldName: "createdAt", key, errors });
  const removeBy = parseIsoDate({ value: flag.removeBy, fieldName: "removeBy", key, errors });

  if (createdAt && removeBy && removeBy < createdAt) {
    addError(errors, `${key}: 'removeBy' cannot be before 'createdAt'`);
  }

  if (removeBy && status !== "removed" && removeBy < todayUtc) {
    addError(
      errors,
      `${key}: flag is expired (${flag.removeBy}) and not removed (status=${status || "empty"})`,
    );
  }
}

function validateFlag(payload) {
  const { flag, context } = payload;
  const { errors } = context;

  if (!flag || typeof flag !== "object") {
    addError(errors, "invalid flag entry: every item must be an object");
    return;
  }

  const key = getFlagKey(flag, errors);
  if (!key) {
    return;
  }

  validateKeyUniqueness({
    key,
    prefix: context.prefix,
    seenKeys: context.seenKeys,
    errors,
  });

  const status = validateOwnerTypeAndStatus({ key, flag, errors });
  validateDates({ key, flag, status, todayUtc: context.todayUtc, errors });
}

function validateFlags(flags, prefix) {
  const errors = [];
  const seenKeys = new Set();
  const now = new Date();
  const todayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const context = { errors, prefix, seenKeys, todayUtc };

  for (const flag of flags) {
    validateFlag({ flag, context });
  }

  return errors;
}

function printSuccess(message) {
  process.stdout.write(`${message}\n`);
}

function printFailure(header, errors) {
  process.stderr.write(`${header}\n`);
  for (const error of errors) {
    process.stderr.write(` - ${error}\n`);
  }
}

function main() {
  const rootDir = process.cwd();
  const catalogPath = path.resolve(rootDir, "config/feature-flags.json");

  try {
    const flags = loadFlags(catalogPath);
    const errors = validateFlags(flags, PLATFORM_PREFIX);

    if (errors.length > 0) {
      printFailure("[feature-flags-hygiene] FAILED", errors);
      process.exit(1);
    }

    printSuccess(`[feature-flags-hygiene] OK (${flags.length} flags)`);
  } catch (error) {
    printFailure("[feature-flags-hygiene] FAILED", [error.message]);
    process.exit(1);
  }
}

main();
