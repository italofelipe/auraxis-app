import {
  validateBundleGovernance,
  validateEasArchiveGovernance,
  validateMobileE2EGovernance,
  validateNodeRuntimeGovernance,
  validateReleaseReadinessGovernance,
  validateReleaseVersionGovernance,
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
      ".github/workflows/mobile-critical-e2e.yml": "with:\n  node-version-file: .nvmrc\n",
      ".github/workflows/store-release.yml": "with:\n  node-version-file: .nvmrc\n",
    },
    ciLocalScript: [
      "NODE_VERSION_FILE=\"$ROOT_DIR/.nvmrc\"",
      "NODE_DOCKER_IMAGE=\"node:${NODE_VERSION}-bookworm\"",
    ].join("\n"),
    qualityGatesDoc:
      "nvm use 25\n# Paridade CI local (ambiente dockerizado Node 25, igual ao runner Linux):",
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
      expect.arrayContaining(["package.json engines.node must be 25.x", ".nvmrc must pin Node 25"]),
    );
  });

  test("accepts a valid release readiness config baseline", () => {
    const errors = validateReleaseReadinessGovernance({
      appConfig: {
        expo: {
          scheme: "auraxisapp",
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
          plugins: ["expo-router", ["expo-splash-screen", {}]],
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

  test("rejects native switches removed by Expo SDK 55", () => {
    const errors = validateReleaseReadinessGovernance({
      appConfig: {
        expo: {
          newArchEnabled: true,
          jsEngine: "hermes",
          scheme: "auraxisapp",
          experiments: { typedRoutes: true },
          ios: {
            bundleIdentifier: "com.sensoriumit.auraxis",
            buildNumber: "1",
          },
          android: {
            edgeToEdgeEnabled: true,
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

    expect(errors).toContain(
      "Expo SDK 55 config must omit obsolete newArchEnabled, jsEngine and edgeToEdgeEnabled fields",
    );
  });
});

describe("EAS source archive governance", () => {
  test("requires .easignore to contain every .gitignore rule and native build exclusions", () => {
    const gitIgnore = ["node_modules/", "android/", "ios/", ".env", "*.p8", "*.keystore"].join(
      "\n",
    );

    expect(
      validateEasArchiveGovernance({
        easIgnore: `${gitIgnore}\n__tests__/\n`,
        gitIgnore,
      }),
    ).toEqual([]);
  });

  test("rejects archives that can upload local dependencies or native directories", () => {
    const errors = validateEasArchiveGovernance({
      easIgnore: ".env\n*.p8\n*.keystore\n",
      gitIgnore: "node_modules/\nandroid/\nios/\n.env\n*.p8\n*.keystore\n",
    });

    expect(errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining("node_modules/"),
        expect.stringContaining("build-safety exclusions"),
      ]),
    );
  });
});

describe("native E2E governance", () => {
  const validE2E = {
    easConfig: {
      build: {
        "e2e-test": {
          distribution: "internal",
          withoutCredentials: true,
          android: { buildType: "apk" },
          ios: { simulator: true },
        },
      },
    },
    e2eWorkflow: [
      "EAS_BUILD_PROFILE: e2e-test",
      '--platform android --profile "$EAS_BUILD_PROFILE"',
      '--platform ios --profile "$EAS_BUILD_PROFILE"',
      "maestro test .maestro/10_mobile_stability_visual.yaml",
      "maestro test .maestro/10_mobile_stability_visual.yaml",
    ].join("\n"),
    e2eFlow: [
      "tab-insights",
      "tab-cartoes",
      "01-pendencias",
      "02-transacoes-analitica",
      "03-calendario",
      "04-movimentacoes-do-dia",
      "05-insights",
      "06-cartoes",
    ]
      .map((value) =>
        value.startsWith("tab-")
          ? value
          : `takeScreenshot: \${MAESTRO_TESTS_DIR}/${value}`,
      )
      .join("\n"),
  };

  test("accepts same-workflow native builds and all required screenshots", () => {
    expect(validateMobileE2EGovernance(validE2E)).toEqual([]);
  });

  test("rejects a missing platform and incomplete visual evidence", () => {
    const errors = validateMobileE2EGovernance({
      ...validE2E,
      e2eWorkflow:
        'EAS_BUILD_PROFILE: e2e-test\n--platform android --profile "$EAS_BUILD_PROFILE"\nmaestro test',
      e2eFlow: "tab-insights\ntab-cartoes",
    });
    expect(errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining("build Android and iOS"),
        expect.stringContaining("missing screenshots"),
      ]),
    );
  });
});

describe("release version governance", () => {
  test("accepts aligned versions and mandatory store changelog automation", () => {
    expect(
      validateReleaseVersionGovernance({
        appConfig: {
          expo: {
            runtimeVersion: { policy: "fingerprint" },
            version: "1.13.6",
          },
        },
        deliveryWorkflow: "workflow_run:\nrelease-delivery-policy.cjs",
        easConfig: {
          cli: { version: ">= 21.2.0" },
          submit: {
            production: {
              android: { releaseStatus: "draft" },
              ios: { metadataPath: "./store.config.js" },
            },
          },
        },
        minimumDeployWorkflow: "store-release-notes.cjs from-text",
        otaWorkflow: "store-release-notes.cjs from-text",
        packageJson: { version: "1.13.6" },
        pullRequestTemplate: "## Changelog de loja",
        releaseManifest: { ".": "1.13.6" },
        releasePleaseConfig: {
          packages: {
            ".": {
              "extra-files": [
                {
                  type: "json",
                  path: "app.json",
                  jsonpath: "$.expo.version",
                },
              ],
            },
          },
        },
        storeReleaseWorkflow: [
          "GOOGLE_PLAY_SERVICE_ACCOUNT_JSON",
          "google-play-release.cjs",
          "APP_STORE_CONNECT_PRIVATE_KEY_BASE64",
          "app-store-connect-release-notes.cjs",
        ].join("\n"),
      }),
    ).toEqual([]);
  });

  test("rejects version drift before a store build can start", () => {
    const errors = validateReleaseVersionGovernance({
      appConfig: {
        expo: {
          runtimeVersion: { policy: "fingerprint" },
          version: "1.13.4",
        },
      },
      deliveryWorkflow: "workflow_run:\nrelease-delivery-policy.cjs",
      easConfig: {
        cli: { version: ">= 21.2.0" },
        submit: {
          production: {
            android: { releaseStatus: "draft" },
            ios: { metadataPath: "./store.config.js" },
          },
        },
      },
      minimumDeployWorkflow: "store-release-notes.cjs from-text",
      otaWorkflow: "store-release-notes.cjs from-text",
      packageJson: { version: "1.13.6" },
      pullRequestTemplate: "## Changelog de loja",
      releaseManifest: { ".": "1.13.6" },
      releasePleaseConfig: {
        packages: {
          ".": {
            "extra-files": [
              {
                type: "json",
                path: "app.json",
                jsonpath: "$.expo.version",
              },
            ],
          },
        },
      },
      storeReleaseWorkflow: [
        "GOOGLE_PLAY_SERVICE_ACCOUNT_JSON",
        "google-play-release.cjs",
        "APP_STORE_CONNECT_PRIVATE_KEY_BASE64",
        "app-store-connect-release-notes.cjs",
      ].join("\n"),
    });

    expect(errors).toContain("package.json, app.json and release manifest versions must match");
  });
});

describe("bundle governance", () => {
  test("accepts the canonical bundle policy baseline", () => {
    expect(
      validateBundleGovernance({
        ciWorkflow: [
          "> Thresholds: ≤ 10 MB (aviso) · ≤ 12 MB",
          "const hardLimit = 12 * 1024 * 1024;",
        ].join("\n"),
        qualityGatesDoc: ["| Android | > 10 MB | > 12 MB |", "| iOS | > 10 MB | > 12 MB |"].join(
          "\n",
        ),
        steeringDoc:
          "bundle Android/iOS ≤ 12 MB (hard limit no CI), com alerta operacional a partir de 10 MB.",
        codingStandardsDoc: "bundle-analysis   (comenta tamanho no PR; hard limit 12 MB)",
      }),
    ).toEqual([]);
  });
});
