#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const EXPECTED_NODE_MAJOR = "24";
const EXPECTED_NODE_ENGINE = "24.x";
const EXPECTED_BUNDLE_WARNING_MB = 6;
const EXPECTED_BUNDLE_HARD_MB = 9;
const ROOT = process.cwd();

const readTextFile = (filePath) => {
  return fs.readFileSync(path.resolve(ROOT, filePath), "utf8");
};

const readJsonFile = (filePath) => {
  return JSON.parse(readTextFile(filePath));
};

const validateNodeRuntimeGovernance = ({
  packageJson,
  nvmrc,
  workflowFiles,
  ciLocalScript,
  qualityGatesDoc,
  steeringDoc,
}) => {
  const errors = [];

  if (packageJson?.engines?.node !== EXPECTED_NODE_ENGINE) {
    errors.push(`package.json engines.node must be ${EXPECTED_NODE_ENGINE}`);
  }

  if (String(nvmrc).trim() !== EXPECTED_NODE_MAJOR) {
    errors.push(`.nvmrc must pin Node ${EXPECTED_NODE_MAJOR}`);
  }

  for (const [filePath, fileContents] of Object.entries(workflowFiles)) {
    if (!/node-version-file:\s*\.nvmrc/u.test(fileContents)) {
      errors.push(`${filePath} must use actions/setup-node with node-version-file: .nvmrc`);
    }

    if (/^\s*NODE_VERSION\s*:/mu.test(fileContents)) {
      errors.push(`${filePath} must not keep a stale hard-coded NODE_VERSION env`);
    }
  }

  if (!/NODE_VERSION_FILE="\$ROOT_DIR\/\.nvmrc"/u.test(ciLocalScript)) {
    errors.push("scripts/run_ci_like_actions_local.sh must read .nvmrc");
  }

  if (!/NODE_DOCKER_IMAGE="node:\$\{NODE_VERSION\}-bookworm"/u.test(ciLocalScript)) {
    errors.push("scripts/run_ci_like_actions_local.sh must derive Docker image from .nvmrc");
  }

  if (/node:25-bookworm/u.test(ciLocalScript)) {
    errors.push("scripts/run_ci_like_actions_local.sh contains stale node:25-bookworm reference");
  }

  if (!new RegExp(`nvm use ${EXPECTED_NODE_MAJOR}`, "u").test(qualityGatesDoc)) {
    errors.push(`.context/quality_gates.md must instruct nvm use ${EXPECTED_NODE_MAJOR}`);
  }

  if (!new RegExp(`Node ${EXPECTED_NODE_MAJOR}`, "u").test(qualityGatesDoc)) {
    errors.push(".context/quality_gates.md must mention the active Node LTS line");
  }

  if (!new RegExp(`Node\\.js \\| ${EXPECTED_NODE_MAJOR} LTS`, "u").test(steeringDoc)) {
    errors.push("steering.md must document Node.js 24 LTS in the stack table");
  }

  return errors;
};

const hasPlugin = (plugins, pluginName) => {
  return Array.isArray(plugins)
    && plugins.some((entry) => {
      if (typeof entry === "string") {
        return entry === pluginName;
      }

      if (Array.isArray(entry)) {
        return entry[0] === pluginName;
      }

      return false;
    });
};

const validateReleaseReadinessGovernance = ({ appConfig, easConfig }) => {
  const errors = [];
  const expo = appConfig?.expo ?? {};
  const ios = expo.ios ?? {};
  const android = expo.android ?? {};
  const experiments = expo.experiments ?? {};
  const extra = expo.extra ?? {};
  const easExtra = extra.eas ?? {};

  if (typeof expo.scheme !== "string" || expo.scheme.trim().length === 0) {
    errors.push("app.json must define expo.scheme");
  }

  if (expo.newArchEnabled !== true) {
    errors.push("app.json must keep expo.newArchEnabled=true");
  }

  if (experiments.typedRoutes !== true) {
    errors.push("app.json must keep expo.experiments.typedRoutes=true");
  }

  if (typeof ios.bundleIdentifier !== "string" || ios.bundleIdentifier.trim().length === 0) {
    errors.push("app.json must define expo.ios.bundleIdentifier");
  }

  if (typeof ios.buildNumber !== "string" || ios.buildNumber.trim().length === 0) {
    errors.push("app.json must define expo.ios.buildNumber");
  }

  if (typeof android.package !== "string" || android.package.trim().length === 0) {
    errors.push("app.json must define expo.android.package");
  }

  if (typeof android.versionCode !== "number" || android.versionCode <= 0) {
    errors.push("app.json must define a positive expo.android.versionCode");
  }

  if (typeof easExtra.projectId !== "string" || easExtra.projectId.trim().length === 0) {
    errors.push("app.json must define expo.extra.eas.projectId");
  }

  if (!hasPlugin(expo.plugins, "expo-router")) {
    errors.push("app.json must include the expo-router plugin");
  }

  if (!hasPlugin(expo.plugins, "expo-splash-screen")) {
    errors.push("app.json must include the expo-splash-screen plugin");
  }

  if (typeof easConfig?.cli?.version !== "string" || easConfig.cli.version.trim().length === 0) {
    errors.push("eas.json must define cli.version");
  }

  if (easConfig?.build?.development?.developmentClient !== true) {
    errors.push("eas.json must keep build.development.developmentClient=true");
  }

  if (easConfig?.build?.preview?.distribution !== "internal") {
    errors.push("eas.json must keep build.preview.distribution=internal");
  }

  if (easConfig?.build?.preview?.android?.buildType !== "apk") {
    errors.push("eas.json must keep build.preview.android.buildType=apk");
  }

  if (easConfig?.build?.production?.distribution !== "store") {
    errors.push("eas.json must keep build.production.distribution=store");
  }

  if (easConfig?.build?.production?.android?.buildType !== "app-bundle") {
    errors.push("eas.json must keep build.production.android.buildType=app-bundle");
  }

  if (typeof easConfig?.submit?.production?.android?.track !== "string") {
    errors.push("eas.json must define submit.production.android.track");
  }

  if (typeof easConfig?.submit?.production?.ios?.ascAppId !== "string") {
    errors.push("eas.json must define submit.production.ios.ascAppId");
  }

  return errors;
};

const validateBundleGovernance = ({
  ciWorkflow,
  qualityGatesDoc,
  steeringDoc,
  codingStandardsDoc,
}) => {
  const errors = [];
  const warningPattern = new RegExp(`≤ ${EXPECTED_BUNDLE_WARNING_MB} MB`, "u");
  const hardLimitPattern = new RegExp(`≤ ${EXPECTED_BUNDLE_HARD_MB} MB`, "u");

  if (!warningPattern.test(ciWorkflow) || !hardLimitPattern.test(ciWorkflow)) {
    errors.push(".github/workflows/ci.yml must document the 6 MB warning and 9 MB hard limit");
  }

  if (!/const limit = 9 \* 1024 \* 1024;/u.test(ciWorkflow)) {
    errors.push(".github/workflows/ci.yml must enforce a 9 MB hard limit");
  }

  if (!/\| Android \| > 6 MB \| > 9 MB \|/u.test(qualityGatesDoc)) {
    errors.push(".context/quality_gates.md must document Android bundle thresholds (6 MB / 9 MB)");
  }

  if (!/\| iOS \| > 6 MB \| > 9 MB \|/u.test(qualityGatesDoc)) {
    errors.push(".context/quality_gates.md must document iOS bundle thresholds (6 MB / 9 MB)");
  }

  if (!/bundle Android\/iOS ≤ 9 MB/u.test(steeringDoc) || !/a partir de 6 MB/u.test(steeringDoc)) {
    errors.push("steering.md must document the 6 MB warning and 9 MB hard limit");
  }

  if (!/hard limit 9 MB/u.test(codingStandardsDoc)) {
    errors.push("CODING_STANDARDS.md must document the 9 MB bundle hard limit");
  }

  return errors;
};

const loadGovernanceInputs = () => {
  return {
    appConfig: readJsonFile("app.json"),
    ciLocalScript: readTextFile("scripts/run_ci_like_actions_local.sh"),
    ciWorkflow: readTextFile(".github/workflows/ci.yml"),
    codingStandardsDoc: readTextFile("CODING_STANDARDS.md"),
    easConfig: readJsonFile("eas.json"),
    nvmrc: readTextFile(".nvmrc"),
    packageJson: readJsonFile("package.json"),
    qualityGatesDoc: readTextFile(".context/quality_gates.md"),
    steeringDoc: readTextFile("steering.md"),
    workflowFiles: {
      ".github/workflows/ci.yml": readTextFile(".github/workflows/ci.yml"),
      ".github/workflows/deploy-minimum.yml": readTextFile(".github/workflows/deploy-minimum.yml"),
      ".github/workflows/store-release.yml": readTextFile(".github/workflows/store-release.yml"),
    },
  };
};

const run = () => {
  const inputs = loadGovernanceInputs();
  const errors = [
    ...validateNodeRuntimeGovernance(inputs),
    ...validateReleaseReadinessGovernance(inputs),
    ...validateBundleGovernance(inputs),
  ];

  if (errors.length > 0) {
    process.stderr.write("[check-runtime-release-governance] FAILED\n");
    for (const error of errors) {
      process.stderr.write(` - ${error}\n`);
    }
    process.exit(1);
  }

  process.stdout.write("[check-runtime-release-governance] OK\n");
};

if (require.main === module) {
  run();
}

module.exports = {
  EXPECTED_BUNDLE_HARD_MB,
  EXPECTED_BUNDLE_WARNING_MB,
  EXPECTED_NODE_ENGINE,
  EXPECTED_NODE_MAJOR,
  loadGovernanceInputs,
  run,
  validateBundleGovernance,
  validateNodeRuntimeGovernance,
  validateReleaseReadinessGovernance,
};
