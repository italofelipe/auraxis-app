import { checkoutPlanSchema } from "@/features/subscription/validators";

describe("subscription validators", () => {
  it("aceita checkout mensal valido", () => {
    expect(() => {
      checkoutPlanSchema.parse({
        planSlug: "premium",
        billingCycle: "monthly",
      });
    }).not.toThrow();
  });

  it("rejeita ciclo de cobranca invalido", () => {
    expect(() => {
      checkoutPlanSchema.parse({
        planSlug: "premium",
        billingCycle: "weekly",
      });
    }).toThrow();
  });
});
