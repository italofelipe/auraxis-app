import {
  isSslPinningEnforced,
  resolveSslPinningPolicy,
  verifyCanonicalRequest,
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

  it("requires both flag and two distinct fingerprints to enforce", () => {
    setEnv("true", "sha256/AAA===,sha256/BBB===");
    const policy = resolveSslPinningPolicy();
    expect(policy.enabled).toBe(true);
    expect(policy.expectedFingerprints).toEqual([
      "sha256/AAA===",
      "sha256/BBB===",
    ]);
  });

  it("ignores a single or duplicated fingerprint", () => {
    setEnv("true", "sha256/AAA===");
    expect(isSslPinningEnforced()).toBe(false);

    setEnv("true", "sha256/AAA===,sha256/AAA===");
    expect(isSslPinningEnforced()).toBe(false);
  });

  it("treats truthy variants of the flag as enabled", () => {
    setEnv("1", "sha256/AAA===,sha256/BBB===");
    expect(isSslPinningEnforced()).toBe(true);
    setEnv("on", "sha256/AAA===,sha256/BBB===");
    expect(isSslPinningEnforced()).toBe(true);
    setEnv("TRUE", "sha256/AAA===,sha256/BBB===");
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

describe("verifyCanonicalRequest", () => {
  it("aceita HTTPS para o host canonico", () => {
    expect(verifyCanonicalRequest("https://api.auraxis.com.br/foo")).toEqual({
      kind: "ok",
    });
  });

  it("bloqueia esquemas nao-HTTPS", () => {
    expect(verifyCanonicalRequest("http://api.auraxis.com.br/foo")).toEqual({
      kind: "blocked",
      reason: "non_https_scheme",
    });
  });

  it("bloqueia hosts nao-canonicos", () => {
    expect(verifyCanonicalRequest("https://api.attacker.com/foo")).toEqual({
      kind: "blocked",
      reason: "non_canonical_host",
    });
    expect(verifyCanonicalRequest("https://auraxis.com.br/")).toEqual({
      kind: "blocked",
      reason: "non_canonical_host",
    });
    expect(
      verifyCanonicalRequest("https://cdn.auraxis.com.br/avatar.png"),
    ).toEqual({
      kind: "blocked",
      reason: "non_canonical_host",
    });
    expect(verifyCanonicalRequest("https://api.auraxis.com.br.attacker.com/")).toEqual({
      kind: "blocked",
      reason: "non_canonical_host",
    });
  });

  it("bloqueia URLs invalidas", () => {
    expect(verifyCanonicalRequest("not a url")).toEqual({
      kind: "blocked",
      reason: "invalid_url",
    });
    expect(verifyCanonicalRequest("")).toEqual({
      kind: "blocked",
      reason: "invalid_url",
    });
  });

  it("e case-insensitive no host", () => {
    expect(verifyCanonicalRequest("https://API.AURAXIS.COM.BR/")).toEqual({
      kind: "ok",
    });
  });
});
