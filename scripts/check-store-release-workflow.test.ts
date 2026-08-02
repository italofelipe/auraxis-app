import path from "node:path";

import {
  findStoreReleaseWorkflowViolations,
  readJobNeeds,
  splitWorkflowJobs,
  stripComments,
  validateMinimumDeployWorkflow,
  validateStoreReleaseWorkflow,
} from "./check-store-release-workflow.cjs";

const REPOSITORY_ROOT = path.resolve(__dirname, "..");

const isolatedStoreWorkflow = `name: Store Release
jobs:
  prepare:
    runs-on: ubuntu-latest
    steps:
      - run: node scripts/store-release-notes.cjs from-text
  android-delivery:
    needs: prepare
    steps:
      - run: eas build --platform android --profile production --non-interactive
      - run: eas submit --platform android --id "$BUILD_ID" --non-interactive
      - run: node scripts/google-play-release.cjs --track internal
  ios-delivery:
    needs: prepare
    steps:
      - run: eas build --platform ios --profile production --non-interactive
      - run: eas metadata:push --profile production --non-interactive
      - run: eas submit --platform ios --id "$BUILD_ID" --non-interactive
      - run: node scripts/app-store-connect-release-notes.cjs --app-id 1
`;

const guardedMinimumWorkflow = `name: Deploy Minimum
jobs:
  web-baseline-artifact:
    steps:
      - run: npx expo export --platform web
  eas-preview-build:
    if: github.event_name == 'workflow_dispatch' && inputs.run_eas_build == 'true'
    steps:
      - run: node scripts/store-release-notes.cjs from-text --version 1.0.0
      - run: eas build --profile preview
`;

describe("check-store-release-workflow", () => {
  test("the real store workflows already satisfy the delivery contract", () => {
    expect(findStoreReleaseWorkflowViolations(REPOSITORY_ROOT)).toEqual([]);
  });

  test("accepts a pipeline where each platform owns its own job", () => {
    expect(validateStoreReleaseWorkflow(isolatedStoreWorkflow)).toEqual([]);
  });

  test("rejects an iOS job chained to the Android job", () => {
    const coupled = isolatedStoreWorkflow.replace(
      "  ios-delivery:\n    needs: prepare",
      "  ios-delivery:\n    needs: [prepare, android-delivery]",
    );

    expect(validateStoreReleaseWorkflow(coupled)).toContain(
      "\"ios-delivery\" must not depend on \"android-delivery\": a failing store cannot block the other",
    );
  });

  test("rejects a pipeline that collapses both platforms into one job", () => {
    const single = isolatedStoreWorkflow
      .replace("  android-delivery:", "  build-and-submit:")
      .replace("  ios-delivery:\n    needs: prepare\n", "");

    const errors = validateStoreReleaseWorkflow(single);
    expect(errors).toContain(
      ".github/workflows/store-release.yml must define the \"android-delivery\" job",
    );
    expect(errors).toContain(
      ".github/workflows/store-release.yml must define the \"ios-delivery\" job",
    );
  });

  test.each([
    ["--what-to-test", "eas submit --platform ios --what-to-test notes.txt"],
    ["--auto-submit", "eas build --platform android --auto-submit"],
    ["--no-wait", "eas submit --platform android --no-wait"],
  ])("rejects the %s delivery flag", (flag, command) => {
    const withFlag = isolatedStoreWorkflow.replace(
      "      - run: eas submit --platform android --id \"$BUILD_ID\" --non-interactive",
      `      - run: ${command}`,
    );

    expect(validateStoreReleaseWorkflow(withFlag)).toContain(
      `.github/workflows/store-release.yml must not use the "${flag}" delivery flag`,
    );
  });

  test("documenting a forbidden flag in a comment is not using it", () => {
    const documented = isolatedStoreWorkflow.replace(
      "  android-delivery:",
      "  # nunca usar --auto-submit nem --no-wait aqui\n  android-delivery:",
    );

    expect(validateStoreReleaseWorkflow(documented)).toEqual([]);
  });

  test("requires the Play release to be completed only after the submission", () => {
    const inverted = isolatedStoreWorkflow.replace(
      "      - run: eas submit --platform android --id \"$BUILD_ID\" --non-interactive\n      - run: node scripts/google-play-release.cjs --track internal",
      "      - run: node scripts/google-play-release.cjs --track internal\n      - run: eas submit --platform android --id \"$BUILD_ID\" --non-interactive",
    );

    expect(validateStoreReleaseWorkflow(inverted)).toContain(
      "Android must submit and wait before completing the Play internal release",
    );
  });

  test("requires the App Store notes to be pushed before the iOS submit", () => {
    const inverted = isolatedStoreWorkflow.replace(
      "      - run: eas metadata:push --profile production --non-interactive\n      - run: eas submit --platform ios --id \"$BUILD_ID\" --non-interactive",
      "      - run: eas submit --platform ios --id \"$BUILD_ID\" --non-interactive\n      - run: eas metadata:push --profile production --non-interactive",
    );

    const errors = validateStoreReleaseWorkflow(inverted);
    expect(errors).toContain("iOS must push the pt-BR App Store notes before submitting the build");
  });

  test("accepts the minimum deploy workflow when only published builds demand notes", () => {
    expect(validateMinimumDeployWorkflow(guardedMinimumWorkflow)).toEqual([]);
  });

  test("rejects gating a push-triggered job on a changelog it can never receive", () => {
    const ungated = guardedMinimumWorkflow.replace(
      "  web-baseline-artifact:\n    steps:\n      - run: npx expo export --platform web",
      "  web-baseline-artifact:\n    steps:\n      - run: node scripts/store-release-notes.cjs from-text --version 1.0.0",
    );

    expect(validateMinimumDeployWorkflow(ungated)).toContain(
      "\"web-baseline-artifact\" validates the store changelog but runs outside a published build: pushes have no release_notes input",
    );
  });

  test("rejects a minimum deploy workflow that publishes without any changelog", () => {
    const withoutNotes = guardedMinimumWorkflow.replace(
      "      - run: node scripts/store-release-notes.cjs from-text --version 1.0.0\n",
      "",
    );

    expect(validateMinimumDeployWorkflow(withoutNotes)).toContain(
      ".github/workflows/deploy-minimum.yml must validate detailed release notes before publishing",
    );
  });

  test("splits jobs and reads both needs syntaxes", () => {
    const jobs = splitWorkflowJobs(`jobs:
  first:
    needs: prepare
  second:
    needs:
      - prepare
      - first
`);

    expect(Object.keys(jobs)).toEqual(["first", "second"]);
    expect(readJobNeeds(jobs.first)).toEqual(["prepare"]);
    expect(readJobNeeds(jobs.second)).toEqual(["prepare", "first"]);
    expect(readJobNeeds("    runs-on: ubuntu-latest")).toEqual([]);
  });

  test("stripComments keeps executable lines untouched", () => {
    expect(stripComments("# comment\n  run: eas build\n")).toBe("  run: eas build\n");
  });

  test("a workflow without a jobs block yields no jobs", () => {
    expect(splitWorkflowJobs("name: nothing\n")).toEqual({});
  });
});
