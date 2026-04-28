import {
  validateBundleGovernance,
  validateNodeRuntimeGovernance,
  validateReleaseReadinessGovernance,
} from "./check-runtime-release-governance.cjs";

const createValidRuntimeInputs = () => {
  return {
    packageJson: {
      engines: {
        node: "25.x",
      },
    },
    nvmrc: "25\n",
    workflowFiles: {
      ".github/workflows/ci.yml": "with:\n  node-version-file: .nvmrc\n",
      ".github/workflows/deploy-minimum.yml": "with:\n  node-version-file: .nvmrc\n",
      ".github/workflows/store-release.yml": "with:\n  node-version-file: .nvmrc\n",
    },
    ciLocalScript: [
      "NODE_VERSION_FILE=\"$ROOT_DIR/.nvmrc\"",
      "NODE_DOCKER_IMAGE=\"node:${NODE_VERSION}-bookworm\"",
    ].join("\n"),
    qualityGatesDoc: "nvm use 25\n# Paridade CI local (ambiente dockerizado Node 25, igual ao runner Linux):",
    steeringDoc: "| Toolchain | Node.js | 25 LTS |",
  };
};

describe("check-runtime-release-governance", () => {
  test("accepts a valid Node runtime governance baseline", () => {
    expect(validateNodeRuntimeGovernance(createValidRuntimeInputs())).toEqual([]);
  });

  test("flags stale Node configuration drift", () => {
    const errors = validateNodeRuntimeGovernance({
      ...createValidRuntimeInputs(),
      packageJson: { engines: { node: "24.x" } },
      nvmrc: "24\n",
      qualityGatesDoc: "nvm use 24\n# Node 24",
      steeringDoc: "| Toolchain | Node.js | 24 LTS |",
    });

    expect(errors).toEqual(
      expect.arrayContaining([
        "package.json engines.node must be 25.x",
        ".nvmrc must pin Node 25",
      ]),
    );
  });

  test("accepts a valid release readiness config baseline", () => {
    const errors = validateReleaseReadinessGovernance({
      appConfig: {
        expo: {
          scheme: "auraxisapp",
          newArchEnabled: true,
          experiments: { typedRoutes: true },
          ios: {
            bundleIdentifier: "com.sensoriumit.auraxis",
            buildNumber: "1",
          },
          android: {
            package: "com.sensoriumit.auraxis",
            versionCode: 1,
          },
          extra: {
            eas: {
              projectId: "project-id",
            },
          },
          plugins: [
            "expo-router",
            ["expo-splash-screen", {}],
          ],
        },
      },
      easConfig: {
        cli: { version: ">= 16.13.0" },
        build: {
          development: {
            developmentClient: true,
          },
          preview: {
            distribution: "internal",
            android: {
              buildType: "apk",
            },
          },
          production: {
            distribution: "store",
            android: {
              buildType: "app-bundle",
            },
          },
        },
        submit: {
          production: {
            android: {
              track: "internal",
            },
            ios: {
              ascAppId: "${ASC_APP_ID}",
            },
          },
        },
      },
    });

    expect(errors).toEqual([]);
  });

  test("flags missing iOS bundle identifier in release config", () => {
    const errors = validateReleaseReadinessGovernance({
      appConfig: {
        expo: {
          scheme: "auraxisapp",
          newArchEnabled: true,
          experiments: { typedRoutes: true },
          ios: {
            buildNumber: "1",
          },
          android: {
            package: "com.sensoriumit.auraxis",
            versionCode: 1,
          },
          extra: {
            eas: {
              projectId: "project-id",
            },
          },
          plugins: ["expo-router", ["expo-splash-screen", {}]],
        },
      },
      easConfig: {
        cli: { version: ">= 16.13.0" },
        build: {
          development: { developmentClient: true },
          preview: { distribution: "internal", android: { buildType: "apk" } },
          production: {
            distribution: "store",
            android: { buildType: "app-bundle" },
          },
        },
        submit: {
          production: {
            android: { track: "internal" },
            ios: { ascAppId: "${ASC_APP_ID}" },
          },
        },
      },
    });

    expect(errors).toContain("app.json must define expo.ios.bundleIdentifier");
  });

  test("accepts the canonical bundle policy baseline", () => {
    expect(
      validateBundleGovernance({
        ciWorkflow: [
          "> Thresholds: ≤ 10 MB (aviso) · ≤ 12 MB",
          "const hardLimit = 12 * 1024 * 1024;",
        ].join("\n"),
        qualityGatesDoc: [
          "| Android | > 10 MB | > 12 MB |",
          "| iOS | > 10 MB | > 12 MB |",
        ].join("\n"),
        steeringDoc: "bundle Android/iOS ≤ 12 MB (hard limit no CI), com alerta operacional a partir de 10 MB.",
        codingStandardsDoc: "bundle-analysis   (comenta tamanho no PR; hard limit 12 MB)",
      }),
    ).toEqual([]);
  });
});
