import {
  findBannedEnvLiteralViolations,
  findLegacySessionPersistenceViolations,
  findSensitiveAppConfigExtraViolations,
  findSensitiveProcessEnvViolations,
} from "./check-client-security-governance.cjs";

describe("check-client-security-governance", () => {
  test("accepts a clean client security baseline", () => {
    const codeFiles = [
      {
        relativePath: "shared/feature-flags/service.ts",
        fileContent: [
          'const key = process.env.EXPO_PUBLIC_UNLEASH_CLIENT_KEY;',
          'const mode = process.env.EXPO_PUBLIC_FLAG_PROVIDER;',
        ].join("\n"),
      },
      {
        relativePath: "shared/config/runtime.ts",
        fileContent: 'const apiUrl = process.env.EXPO_PUBLIC_API_URL;',
      },
    ];

    expect(findBannedEnvLiteralViolations(codeFiles)).toEqual([]);
    expect(findSensitiveProcessEnvViolations(codeFiles)).toEqual([]);
    expect(
      findSensitiveAppConfigExtraViolations({
        expo: {
          extra: {
            sentryDsn: "",
            appEnv: "development",
            eas: {
              projectId: "project-id",
            },
          },
        },
      }),
    ).toEqual([]);
    expect(
      findLegacySessionPersistenceViolations(
        'await SecureStore.setItemAsync(SESSION_KEY, "payload");',
      ),
    ).toEqual([]);
  });

  test("flags banned env key literals in client code", () => {
    const errors = findBannedEnvLiteralViolations([
      {
        relativePath: "shared/config/runtime.ts",
        fileContent:
          'const legacy = process.env.EXPO_PUBLIC_OBSERVABILITY_EXPORT_TOKEN;',
      },
    ]);

    expect(errors).toEqual([
      "banned client env key reference (EXPO_PUBLIC_OBSERVABILITY_EXPORT_TOKEN): shared/config/runtime.ts:1",
    ]);
  });

  test("flags sensitive process.env references in client code", () => {
    const errors = findSensitiveProcessEnvViolations([
      {
        relativePath: "shared/config/runtime.ts",
        fileContent: 'const password = process.env.API_PASSWORD;',
      },
    ]);

    expect(errors).toEqual([
      "sensitive process.env reference in client code (API_PASSWORD): shared/config/runtime.ts:1",
    ]);
  });

  test("flags sensitive expo.extra keys", () => {
    const errors = findSensitiveAppConfigExtraViolations({
      expo: {
        extra: {
          observabilityExportToken: "secret",
          eas: {
            projectId: "project-id",
          },
        },
      },
    });

    expect(errors).toEqual([
      "sensitive expo.extra key detected in app.json (observabilityExportToken)",
    ]);
  });

  test("flags legacy session writes back to secure storage", () => {
    const errors = findLegacySessionPersistenceViolations(
      'await SecureStore.setItemAsync(LEGACY_ACCESS_TOKEN_KEY, token);',
    );

    expect(errors).toEqual([
      "legacy session keys must not be written back to SecureStore",
    ]);
  });
});
