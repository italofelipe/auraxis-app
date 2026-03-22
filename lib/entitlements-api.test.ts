import { createEntitlementsApi } from "@/lib/entitlements-api";

describe("entitlements api", () => {
  it("normaliza a resposta moderna", async () => {
    const get = jest.fn().mockResolvedValue({
      data: { has_access: true },
    });

    const api = createEntitlementsApi({ get });
    await expect(api.checkEntitlement("advanced_simulations")).resolves.toBe(true);
  });

  it("normaliza a resposta legacy", async () => {
    const get = jest.fn().mockResolvedValue({
      data: { active: false, feature_key: "advanced_simulations" },
    });

    const api = createEntitlementsApi({ get });
    await expect(api.checkEntitlement("advanced_simulations")).resolves.toBe(false);
  });
});
