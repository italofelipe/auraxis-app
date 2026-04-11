import { resolveQueryPolicy } from "@/core/query/query-policy";

describe("query policy", () => {
  it("resolves policies by root key", () => {
    const policy = resolveQueryPolicy(["dashboard", "overview"]);

    expect(policy.staleTime).toBe(30_000);
    expect(policy.gcTime).toBe(300_000);
  });

  it("falls back to the default policy for unknown keys", () => {
    const policy = resolveQueryPolicy(["unknown", "key"]);

    expect(policy.staleTime).toBe(30_000);
    expect(policy.gcTime).toBe(300_000);
  });

  it("returns the default policy for non-string root keys", () => {
    const policy = resolveQueryPolicy([123, "detail"]);

    expect(policy.staleTime).toBe(30_000);
    expect(policy.gcTime).toBe(300_000);
  });
});
