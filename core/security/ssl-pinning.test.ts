import {
  isSslPinningEnforced,
  resolveSslPinningPolicy,
} from "@/core/security/ssl-pinning";

const setEnv = (
  enabled: string | undefined,
  fingerprints: string | undefined,
): void => {
  if (enabled === undefined) {
    delete process.env.EXPO_PUBLIC_SSL_PINNING_ENABLED;
  } else {
    process.env.EXPO_PUBLIC_SSL_PINNING_ENABLED = enabled;
  }
  if (fingerprints === undefined) {
    delete process.env.EXPO_PUBLIC_SSL_PINNING_FINGERPRINTS;
  } else {
    process.env.EXPO_PUBLIC_SSL_PINNING_FINGERPRINTS = fingerprints;
  }
};

describe("ssl-pinning policy", () => {
  beforeEach(() => {
    setEnv(undefined, undefined);
  });

  it("returns disabled when env is unset", () => {
    const policy = resolveSslPinningPolicy();
    expect(policy.enabled).toBe(false);
    expect(policy.expectedFingerprints).toEqual([]);
  });

  it("ignores enabled flag without fingerprints", () => {
    setEnv("true", undefined);
    expect(isSslPinningEnforced()).toBe(false);
  });

  it("requires both flag and fingerprints to enforce", () => {
    setEnv("true", "sha256/AAA===,sha256/BBB===");
    const policy = resolveSslPinningPolicy();
    expect(policy.enabled).toBe(true);
    expect(policy.expectedFingerprints).toEqual([
      "sha256/AAA===",
      "sha256/BBB===",
    ]);
  });

  it("treats truthy variants of the flag as enabled", () => {
    setEnv("1", "sha256/AAA===");
    expect(isSslPinningEnforced()).toBe(true);
    setEnv("on", "sha256/AAA===");
    expect(isSslPinningEnforced()).toBe(true);
    setEnv("TRUE", "sha256/AAA===");
    expect(isSslPinningEnforced()).toBe(true);
  });

  it("trims whitespace and skips empty entries", () => {
    setEnv("true", "sha256/AAA=== , , sha256/BBB===");
    expect(resolveSslPinningPolicy().expectedFingerprints).toEqual([
      "sha256/AAA===",
      "sha256/BBB===",
    ]);
  });
});
