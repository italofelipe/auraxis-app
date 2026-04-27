import {
  isTurnstileEnabled,
  resolveTurnstilePolicy,
} from "@/core/security/turnstile-config";

const setSiteKey = (value: string | undefined): void => {
  if (value === undefined) {
    delete process.env.EXPO_PUBLIC_TURNSTILE_SITE_KEY;
  } else {
    process.env.EXPO_PUBLIC_TURNSTILE_SITE_KEY = value;
  }
};

describe("turnstile-config", () => {
  beforeEach(() => {
    setSiteKey(undefined);
  });

  it("returns disabled when no site key is configured", () => {
    expect(resolveTurnstilePolicy()).toEqual({
      enabled: false,
      siteKey: null,
      isTestKey: false,
    });
    expect(isTurnstileEnabled()).toBe(false);
  });

  it("trims whitespace and rejects empty strings", () => {
    setSiteKey("   ");
    expect(isTurnstileEnabled()).toBe(false);
  });

  it("flags the Cloudflare test key", () => {
    setSiteKey("1x00000000000000000000AA");
    const policy = resolveTurnstilePolicy();
    expect(policy.enabled).toBe(true);
    expect(policy.isTestKey).toBe(true);
  });

  it("treats production keys as non-test", () => {
    setSiteKey("0x4AAAAAAAprodKey");
    const policy = resolveTurnstilePolicy();
    expect(policy.enabled).toBe(true);
    expect(policy.isTestKey).toBe(false);
    expect(policy.siteKey).toBe("0x4AAAAAAAprodKey");
  });
});
