#!/usr/bin/env node

/**
 * Governance for the store delivery workflows (#722).
 *
 * The 1.13.7 release proved three failure modes that a green unit suite never
 * catches, because they live in YAML:
 *
 * 1. an EAS Enterprise-only flag aborted the iOS submission;
 * 2. Android and iOS shared a single job, so the iOS failure took Android down
 *    with it;
 * 3. `Deploy Minimum` demanded a store changelog on every push to `main`,
 *    where no changelog input exists, and died before publishing anything.
 *
 * These checks freeze the shape that fixed each one.
 */

const fs = require("node:fs");
const path = require("node:path");

const STORE_RELEASE_WORKFLOW = ".github/workflows/store-release.yml";
const MINIMUM_DEPLOY_WORKFLOW = ".github/workflows/deploy-minimum.yml";

const PREPARE_JOB = "prepare";
const ANDROID_JOB = "android-delivery";
const IOS_JOB = "ios-delivery";

/**
 * Flags the store pipeline must never reintroduce.
 *
 * - `--what-to-test` only exists on the EAS Enterprise plan;
 * - `--auto-submit` hides the submission result inside the build command and
 *   couples both platforms into one step;
 * - `--no-wait` returns before the submission finishes, so the finalization
 *   would run against a build the store has not accepted yet.
 */
const FORBIDDEN_DELIVERY_FLAGS = ["--what-to-test", "--auto-submit", "--no-wait"];

const readWorkflow = (rootDirectory, relativePath) => {
  const absolutePath = path.join(rootDirectory, relativePath);
  return fs.existsSync(absolutePath) ? fs.readFileSync(absolutePath, "utf8") : "";
};

/**
 * Drops comment-only lines so documenting a forbidden flag ("we never pass
 * --auto-submit") is not read as using it.
 */
const stripComments = (workflow) => {
  return String(workflow ?? "")
    .split("\n")
    .filter((line) => !/^\s*#/u.test(line))
    .join("\n");
};

/** Splits a workflow into `{ jobId: blockText }` using the 2-space job indent. */
const splitWorkflowJobs = (workflow) => {
  const lines = String(workflow ?? "").split("\n");
  const jobsIndex = lines.findIndex((line) => /^jobs:\s*$/u.test(line));

  if (jobsIndex === -1) {
    return {};
  }

  const blocks = new Map();
  let current = null;

  for (const line of lines.slice(jobsIndex + 1)) {
    const jobStart = /^ {2}([A-Za-z0-9_-]+):\s*$/u.exec(line);

    if (jobStart) {
      current = jobStart[1];
      blocks.set(current, []);
      continue;
    }

    if (line.trim() !== "" && !/^\s/u.test(line)) {
      break;
    }

    if (current) {
      blocks.get(current).push(line);
    }
  }

  return Object.fromEntries([...blocks].map(([id, body]) => [id, body.join("\n")]));
};

/** Reads a job's `needs`, supporting both the inline and the list syntax. */
const readJobNeeds = (jobBlock) => {
  // `[ \t]*` and not `\s*`: `\s` swallows the newline and would capture the
  // first item of the list syntax as if it were an inline value.
  const inline = /^ {4}needs:[ \t]*(.*)$/mu.exec(String(jobBlock ?? ""));

  if (!inline) {
    return [];
  }

  const value = inline[1].trim();

  if (value.startsWith("[")) {
    return value
      .slice(1, value.endsWith("]") ? -1 : undefined)
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  if (value !== "") {
    return [value];
  }

  return [...String(jobBlock).matchAll(/^ {6}-\s*([A-Za-z0-9_-]+)\s*$/gmu)].map(
    (match) => match[1],
  );
};

const runsBefore = (block, first, second) => {
  const firstIndex = block.indexOf(first);
  const secondIndex = block.indexOf(second);
  return firstIndex !== -1 && secondIndex !== -1 && firstIndex < secondIndex;
};

const validateStoreReleaseWorkflow = (workflow) => {
  const errors = [];
  const executable = stripComments(workflow);
  const jobs = splitWorkflowJobs(executable);

  for (const jobId of [PREPARE_JOB, ANDROID_JOB, IOS_JOB]) {
    if (!jobs[jobId]) {
      errors.push(`${STORE_RELEASE_WORKFLOW} must define the "${jobId}" job`);
    }
  }

  const platformJobs = [
    { id: ANDROID_JOB, sibling: IOS_JOB },
    { id: IOS_JOB, sibling: ANDROID_JOB },
  ];

  for (const { id, sibling } of platformJobs) {
    const block = jobs[id];

    if (!block) {
      continue;
    }

    const needs = readJobNeeds(block);

    if (!needs.includes(PREPARE_JOB)) {
      errors.push(`"${id}" must depend on "${PREPARE_JOB}"`);
    }

    if (needs.includes(sibling)) {
      errors.push(`"${id}" must not depend on "${sibling}": a failing store cannot block the other`);
    }
  }

  for (const flag of FORBIDDEN_DELIVERY_FLAGS) {
    if (executable.includes(flag)) {
      errors.push(`${STORE_RELEASE_WORKFLOW} must not use the "${flag}" delivery flag`);
    }
  }

  if (jobs[ANDROID_JOB] && !runsBefore(jobs[ANDROID_JOB], "eas submit", "google-play-release.cjs")) {
    errors.push("Android must submit and wait before completing the Play internal release");
  }

  if (jobs[IOS_JOB] && !runsBefore(jobs[IOS_JOB], "eas metadata:push", "eas submit")) {
    errors.push("iOS must push the pt-BR App Store notes before submitting the build");
  }

  if (
    jobs[IOS_JOB] &&
    !runsBefore(jobs[IOS_JOB], "eas submit", "app-store-connect-release-notes.cjs")
  ) {
    errors.push("iOS must submit and wait before attaching the TestFlight notes");
  }

  return errors;
};

const validateMinimumDeployWorkflow = (workflow) => {
  const errors = [];
  const jobs = splitWorkflowJobs(stripComments(workflow));
  const validationJobs = Object.entries(jobs).filter(([, block]) =>
    block.includes("store-release-notes.cjs from-text"),
  );

  if (validationJobs.length === 0) {
    errors.push(`${MINIMUM_DEPLOY_WORKFLOW} must validate detailed release notes before publishing`);
    return errors;
  }

  for (const [id, block] of validationJobs) {
    if (!/inputs\.run_eas_build == 'true'/u.test(block)) {
      errors.push(
        `"${id}" validates the store changelog but runs outside a published build: pushes have no release_notes input`,
      );
    }
  }

  return errors;
};

const findStoreReleaseWorkflowViolations = (rootDirectory) => {
  return [
    ...validateStoreReleaseWorkflow(readWorkflow(rootDirectory, STORE_RELEASE_WORKFLOW)),
    ...validateMinimumDeployWorkflow(readWorkflow(rootDirectory, MINIMUM_DEPLOY_WORKFLOW)),
  ];
};

const main = () => {
  const violations = findStoreReleaseWorkflowViolations(process.cwd());

  if (violations.length > 0) {
    process.stderr.write("[store-release-workflow] FAILED\n");
    violations.forEach((violation) => {
      process.stderr.write(` - ${violation}\n`);
    });
    process.exit(1);
  }

  process.stdout.write("[store-release-workflow] OK\n");
};

if (require.main === module) {
  main();
}

module.exports = {
  ANDROID_JOB,
  FORBIDDEN_DELIVERY_FLAGS,
  IOS_JOB,
  PREPARE_JOB,
  findStoreReleaseWorkflowViolations,
  readJobNeeds,
  splitWorkflowJobs,
  stripComments,
  validateMinimumDeployWorkflow,
  validateStoreReleaseWorkflow,
};
