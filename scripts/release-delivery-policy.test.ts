import { matchingBuilds, platformState, resolveDeliveryMode } from "./release-delivery-policy.cjs";

type Build = {
  appVersion: string;
  buildProfile: string;
  createdAt: string;
  id: string;
  platform: string;
  runtimeVersion: string;
  status: string;
};

const build = (
  platform: "ANDROID" | "IOS",
  status: string,
  runtimeVersion = "native-hash",
): Build => ({
  appVersion: "1.13.6",
  buildProfile: "production",
  createdAt: "2026-07-24T12:00:00Z",
  id: `${platform.toLowerCase()}-${status.toLowerCase()}`,
  platform,
  runtimeVersion,
  status,
});

describe("release-delivery-policy", () => {
  test("selects OTA when both native runtimes have finished builds", () => {
    const result = resolveDeliveryMode({
      builds: [build("ANDROID", "FINISHED"), build("IOS", "FINISHED")],
      fingerprints: {
        android: "native-hash",
        ios: "native-hash",
      },
      profile: "production",
    });

    expect(result).toEqual({
      buildIds: {
        android: "android-finished",
        ios: "ios-finished",
      },
      mode: "ota",
      states: {
        android: "ready",
        ios: "ready",
      },
    });
  });

  test("selects a native build when either platform is missing", () => {
    const result = resolveDeliveryMode({
      builds: [build("ANDROID", "FINISHED")],
      fingerprints: {
        android: "native-hash",
        ios: "native-hash",
      },
      profile: "production",
    });

    expect(result.mode).toBe("build");
    expect(result.states).toEqual({
      android: "ready",
      ios: "missing",
    });
  });

  test("does not duplicate a build that is already active", () => {
    const result = resolveDeliveryMode({
      builds: [build("ANDROID", "IN_PROGRESS"), build("IOS", "FINISHED")],
      fingerprints: {
        android: "native-hash",
        ios: "native-hash",
      },
      profile: "production",
    });

    expect(result).toEqual({
      buildIds: {
        android: null,
        ios: "ios-finished",
      },
      mode: "wait",
      states: {
        android: "building",
        ios: "ready",
      },
    });
  });

  test("waits when one platform is building and the other is not visible yet", () => {
    const result = resolveDeliveryMode({
      builds: [build("ANDROID", "IN_PROGRESS")],
      fingerprints: {
        android: "native-hash",
        ios: "native-hash",
      },
      profile: "production",
    });

    expect(result.mode).toBe("wait");
    expect(result.states).toEqual({
      android: "building",
      ios: "missing",
    });
  });

  test("ignores builds from another profile or runtime fingerprint", () => {
    const builds = [
      build("ANDROID", "FINISHED", "old-hash"),
      {
        ...build("ANDROID", "FINISHED", "native-hash"),
        buildProfile: "preview",
      },
    ];

    expect(
      platformState({
        builds,
        fingerprint: "native-hash",
        platform: "android",
        profile: "production",
      }),
    ).toBe("missing");
    expect(
      matchingBuilds({
        builds,
        fingerprint: "native-hash",
        platform: "android",
      }),
    ).toHaveLength(1);
  });

  test("requires an exact app version when store deduplication requests it", () => {
    const result = resolveDeliveryMode({
      appVersion: "1.13.7",
      builds: [build("ANDROID", "FINISHED"), build("IOS", "FINISHED")],
      fingerprints: {
        android: "native-hash",
        ios: "native-hash",
      },
      profile: "production",
    });

    expect(result.mode).toBe("build");
    expect(result.states).toEqual({
      android: "missing",
      ios: "missing",
    });
  });

  test("deduplicates a single-platform manual release independently", () => {
    const result = resolveDeliveryMode({
      builds: [build("ANDROID", "FINISHED")],
      fingerprints: {
        android: "native-hash",
        ios: "native-hash",
      },
      platforms: ["android"],
      profile: "production",
    });

    expect(result).toEqual({
      buildIds: { android: "android-finished" },
      mode: "ota",
      states: { android: "ready" },
    });
  });
});
