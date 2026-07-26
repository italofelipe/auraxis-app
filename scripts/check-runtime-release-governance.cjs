#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const EXPECTED_NODE_MAJOR = "25";
const EXPECTED_NODE_ENGINE = "25.x";
const EXPECTED_BUNDLE_WARNING_MB = 10;
const EXPECTED_BUNDLE_HARD_MB = 12;
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
  return (
    Array.isArray(plugins) &&
    plugins.some((entry) => {
      if (typeof entry === "string") {
        return entry === pluginName;
      }

      if (Array.isArray(entry)) {
        return entry[0] === pluginName;
      }

      return false;
    })
  );
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

  if (
    Object.hasOwn(expo, "newArchEnabled") ||
    Object.hasOwn(expo, "jsEngine") ||
    Object.hasOwn(expo.android ?? {}, "edgeToEdgeEnabled")
  ) {
    errors.push(
      "Expo SDK 55 config must omit obsolete newArchEnabled, jsEngine and edgeToEdgeEnabled fields",
    );
  }

  if (experiments.typedRoutes !== true) {
    errors.push("app.json must keep expo.experiments.typedRoutes=true");
  }

  if (typeof ios.bundleIdentifier !== "string" || ios.bundleIdentifier.trim().length === 0) {
    errors.push("app.json must define expo.ios.bundleIdentifier");
  }

  // With appVersionSource=remote, EAS owns buildNumber/versionCode; local
  // values drift from the real ones and EAS Build warns they are ignored.
  const remoteVersionSource = easConfig?.cli?.appVersionSource === "remote";

  if (remoteVersionSource) {
    if (ios.buildNumber !== undefined) {
      errors.push(
        "app.json must not define expo.ios.buildNumber when eas.json cli.appVersionSource=remote",
      );
    }
  } else if (typeof ios.buildNumber !== "string" || ios.buildNumber.trim().length === 0) {
    errors.push("app.json must define expo.ios.buildNumber");
  }

  if (typeof android.package !== "string" || android.package.trim().length === 0) {
    errors.push("app.json must define expo.android.package");
  }

  if (remoteVersionSource) {
    if (android.versionCode !== undefined) {
      errors.push(
        "app.json must not define expo.android.versionCode when eas.json cli.appVersionSource=remote",
      );
    }
  } else if (typeof android.versionCode !== "number" || android.versionCode <= 0) {
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

const ignoreRules = (contents) => {
  return String(contents ?? "")
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"));
};

const validateEasArchiveGovernance = ({ easIgnore, gitIgnore }) => {
  const errors = [];
  const easRules = new Set(ignoreRules(easIgnore));
  const missingGitRules = ignoreRules(gitIgnore).filter((rule) => !easRules.has(rule));
  const mandatoryRules = ["node_modules/", "android/", "ios/", ".env", "*.p8", "*.keystore"];
  const missingMandatoryRules = mandatoryRules.filter((rule) => !easRules.has(rule));

  if (missingGitRules.length > 0) {
    errors.push(
      `.easignore must be a strict superset of .gitignore; missing: ${missingGitRules.join(", ")}`,
    );
  }

  if (missingMandatoryRules.length > 0) {
    errors.push(
      `.easignore is missing build-safety exclusions: ${missingMandatoryRules.join(", ")}`,
    );
  }

  return errors;
};

const validateMobileE2EGovernance = ({ easConfig, e2eWorkflow, e2eFlow }) => {
  const errors = [];
  const profile = easConfig?.build?.["e2e-test"];

  if (profile?.withoutCredentials !== true) {
    errors.push("eas.json build.e2e-test must use withoutCredentials=true");
  }
  if (profile?.distribution !== "internal") {
    errors.push("eas.json build.e2e-test must use internal distribution");
  }
  if (profile?.android?.buildType !== "apk") {
    errors.push("eas.json build.e2e-test must produce an Android APK");
  }
  if (profile?.ios?.simulator !== true) {
    errors.push("eas.json build.e2e-test must produce an iOS simulator build");
  }

  const workflow = String(e2eWorkflow ?? "");
  // Híbrido (#734): E2E builda no runner; a cota EAS fica reservada para loja.
  // Nota: o build do simulador usa a assinatura ad-hoc padrão do Xcode —
  // desligar code signing quebra Keychain/SecureStore e trava o startup.
  if (
    !/expo prebuild --platform android --no-install/u.test(workflow) ||
    !/expo prebuild --platform ios --no-install/u.test(workflow) ||
    !/gradlew assembleRelease/u.test(workflow) ||
    !/-sdk iphonesimulator/u.test(workflow)
  ) {
    errors.push(
      "Native E2E workflow must build Android and iOS on the runner (prebuild + assembleRelease + xcodebuild simulator)",
    );
  }
  if (/eas build/u.test(workflow)) {
    errors.push(
      "Native E2E workflow must not consume EAS build quota (hybrid: EAS is reserved for store builds)",
    );
  }
  if (
    (workflow.match(/maestro test/gu) ?? []).length < 2 ||
    !/10_mobile_stability_visual\.yaml/u.test(workflow)
  ) {
    errors.push("Native E2E workflow must run the critical Maestro flow on both platforms");
  }
  if (
    (workflow.match(/id:\s*validate-e2e-credentials/gu) ?? []).length < 2 ||
    !/Missing E2E_EMAIL/u.test(workflow) ||
    !/Missing E2E_PASSWORD/u.test(workflow)
  ) {
    errors.push("Native E2E workflow must fail before builds when test credentials are missing");
  }
  if (
    (workflow.match(/steps\.validate-e2e-credentials\.outcome == 'success'/gu) ?? []).length < 2
  ) {
    errors.push("Native E2E artifact uploads must be skipped when credential validation fails");
  }

  const flow = String(e2eFlow ?? "");
  const requiredScreenshots = [
    "01-pendencias",
    "02-transacoes-analitica",
    "03-calendario",
    "04-movimentacoes-do-dia",
    "05-insights",
    "06-cartoes",
  ];
  const missingScreenshots = requiredScreenshots.filter(
    (screenshot) => !flow.includes(`MAESTRO_TESTS_DIR}/${screenshot}`),
  );
  if (missingScreenshots.length > 0) {
    errors.push(
      `Critical Maestro flow is missing screenshots: ${missingScreenshots.join(", ")}`,
    );
  }
  if (!/tab-insights/u.test(flow) || !/tab-cartoes/u.test(flow)) {
    errors.push("Critical Maestro flow must navigate through Insights and Cartões");
  }

  return errors;
};

const validateReleaseVersionGovernance = ({
  appConfig,
  deliveryWorkflow,
  easConfig,
  minimumDeployWorkflow,
  otaWorkflow,
  packageJson,
  pullRequestTemplate,
  releaseManifest,
  releasePleaseConfig,
  storeReleaseWorkflow,
}) => {
  const errors = [];
  const packageVersion = packageJson?.version;
  const appVersion = appConfig?.expo?.version;
  const manifestVersion = releaseManifest?.["."];

  if (packageVersion !== appVersion || packageVersion !== manifestVersion) {
    errors.push("package.json, app.json and release manifest versions must match");
  }

  if (appConfig?.expo?.runtimeVersion?.policy !== "fingerprint") {
    errors.push("app.json must use expo.runtimeVersion.policy=fingerprint");
  }

  const extraFiles = releasePleaseConfig?.packages?.["."]?.["extra-files"] ?? [];
  const syncsAppVersion = extraFiles.some(
    (entry) =>
      entry?.type === "json" && entry?.path === "app.json" && entry?.jsonpath === "$.expo.version",
  );

  if (!syncsAppVersion) {
    errors.push("Release Please must synchronize app.json expo.version");
  }

  if (!String(easConfig?.cli?.version ?? "").includes("21.2.0")) {
    errors.push("eas.json must require EAS CLI 21.2.0 or newer");
  }

  if (easConfig?.submit?.production?.android?.releaseStatus !== "draft") {
    errors.push("Android submit must remain draft until detailed notes are attached");
  }

  if (easConfig?.submit?.production?.ios?.metadataPath !== "./store.config.js") {
    errors.push("iOS submit must use the generated EAS Metadata config");
  }

  if (!/^## Changelog de loja$/mu.test(pullRequestTemplate)) {
    errors.push("PR template must require a store changelog section");
  }

  if (
    !/store-release-notes\.cjs validate-pr/u.test(otaWorkflow) &&
    !/store-release-notes\.cjs from-text/u.test(otaWorkflow)
  ) {
    errors.push("OTA workflow must validate detailed release notes");
  }

  if (!/store-release-notes\.cjs from-text/u.test(minimumDeployWorkflow)) {
    errors.push("Manual preview builds must validate detailed release notes");
  }

  if (
    !/GOOGLE_PLAY_SERVICE_ACCOUNT_JSON/u.test(storeReleaseWorkflow) ||
    !/google-play-release\.cjs/u.test(storeReleaseWorkflow)
  ) {
    errors.push("Store workflow must attach notes before completing Google Play release");
  }

  if (
    !/APP_STORE_CONNECT_PRIVATE_KEY_BASE64/u.test(storeReleaseWorkflow) ||
    !/app-store-connect-release-notes\.cjs/u.test(storeReleaseWorkflow)
  ) {
    errors.push("Store workflow must attach detailed What to Test notes to TestFlight");
  }

  if (/--what-to-test/u.test(storeReleaseWorkflow)) {
    errors.push("Store workflow must not use the Enterprise-only EAS --what-to-test flag");
  }

  if (
    !/workflow_run:/u.test(deliveryWorkflow) ||
    !/release-delivery-policy\.cjs/u.test(deliveryWorkflow)
  ) {
    errors.push("Post-CI workflow must classify OTA versus native delivery");
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
    errors.push(
      `.github/workflows/ci.yml must document the ${EXPECTED_BUNDLE_WARNING_MB} MB warning and ${EXPECTED_BUNDLE_HARD_MB} MB hard limit`,
    );
  }

  const hardLimitConstantPattern = new RegExp(
    `const hardLimit = ${EXPECTED_BUNDLE_HARD_MB} \\* 1024 \\* 1024;`,
    "u",
  );
  if (!hardLimitConstantPattern.test(ciWorkflow)) {
    errors.push(`.github/workflows/ci.yml must enforce a ${EXPECTED_BUNDLE_HARD_MB} MB hard limit`);
  }

  const androidQualityRow = new RegExp(
    `\\| Android \\| > ${EXPECTED_BUNDLE_WARNING_MB} MB \\| > ${EXPECTED_BUNDLE_HARD_MB} MB \\|`,
    "u",
  );
  if (!androidQualityRow.test(qualityGatesDoc)) {
    errors.push(
      `.context/quality_gates.md must document Android bundle thresholds (${EXPECTED_BUNDLE_WARNING_MB} MB / ${EXPECTED_BUNDLE_HARD_MB} MB)`,
    );
  }

  const iosQualityRow = new RegExp(
    `\\| iOS \\| > ${EXPECTED_BUNDLE_WARNING_MB} MB \\| > ${EXPECTED_BUNDLE_HARD_MB} MB \\|`,
    "u",
  );
  if (!iosQualityRow.test(qualityGatesDoc)) {
    errors.push(
      `.context/quality_gates.md must document iOS bundle thresholds (${EXPECTED_BUNDLE_WARNING_MB} MB / ${EXPECTED_BUNDLE_HARD_MB} MB)`,
    );
  }

  const steeringHardPattern = new RegExp(`bundle Android/iOS ≤ ${EXPECTED_BUNDLE_HARD_MB} MB`, "u");
  const steeringWarnPattern = new RegExp(`a partir de ${EXPECTED_BUNDLE_WARNING_MB} MB`, "u");
  if (!steeringHardPattern.test(steeringDoc) || !steeringWarnPattern.test(steeringDoc)) {
    errors.push(
      `steering.md must document the ${EXPECTED_BUNDLE_WARNING_MB} MB warning and ${EXPECTED_BUNDLE_HARD_MB} MB hard limit`,
    );
  }

  const codingHardPattern = new RegExp(`hard limit ${EXPECTED_BUNDLE_HARD_MB} MB`, "u");
  if (!codingHardPattern.test(codingStandardsDoc)) {
    errors.push(
      `CODING_STANDARDS.md must document the ${EXPECTED_BUNDLE_HARD_MB} MB bundle hard limit`,
    );
  }

  return errors;
};

const loadGovernanceInputs = () => {
  return {
    appConfig: readJsonFile("app.json"),
    ciLocalScript: readTextFile("scripts/run_ci_like_actions_local.sh"),
    ciWorkflow: readTextFile(".github/workflows/ci.yml"),
    codingStandardsDoc: readTextFile("CODING_STANDARDS.md"),
    easIgnore: readTextFile(".easignore"),
    easConfig: readJsonFile("eas.json"),
    e2eFlow: readTextFile(".maestro/10_mobile_stability_visual.yaml"),
    e2eWorkflow: readTextFile(".github/workflows/mobile-critical-e2e.yml"),
    deliveryWorkflow: readTextFile(".github/workflows/delivery-after-ci.yml"),
    minimumDeployWorkflow: readTextFile(".github/workflows/deploy-minimum.yml"),
    nvmrc: readTextFile(".nvmrc"),
    gitIgnore: readTextFile(".gitignore"),
    packageJson: readJsonFile("package.json"),
    pullRequestTemplate: readTextFile(".github/pull_request_template.md"),
    qualityGatesDoc: readTextFile(".context/quality_gates.md"),
    releaseManifest: readJsonFile(".release-please-manifest.json"),
    releasePleaseConfig: readJsonFile(".release-please-config.json"),
    otaWorkflow: readTextFile(".github/workflows/ota-update.yml"),
    steeringDoc: readTextFile("steering.md"),
    storeReleaseWorkflow: readTextFile(".github/workflows/store-release.yml"),
    workflowFiles: {
      ".github/workflows/ci.yml": readTextFile(".github/workflows/ci.yml"),
      ".github/workflows/deploy-minimum.yml": readTextFile(".github/workflows/deploy-minimum.yml"),
      ".github/workflows/delivery-after-ci.yml": readTextFile(
        ".github/workflows/delivery-after-ci.yml",
      ),
      ".github/workflows/mobile-critical-e2e.yml": readTextFile(
        ".github/workflows/mobile-critical-e2e.yml",
      ),
      ".github/workflows/store-release.yml": readTextFile(".github/workflows/store-release.yml"),
    },
  };
};

const run = () => {
  const inputs = loadGovernanceInputs();
  const errors = [
    ...validateNodeRuntimeGovernance(inputs),
    ...validateReleaseReadinessGovernance(inputs),
    ...validateEasArchiveGovernance(inputs),
    ...validateMobileE2EGovernance(inputs),
    ...validateReleaseVersionGovernance(inputs),
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
  validateEasArchiveGovernance,
  validateMobileE2EGovernance,
  validateNodeRuntimeGovernance,
  validateReleaseReadinessGovernance,
  validateReleaseVersionGovernance,
};
