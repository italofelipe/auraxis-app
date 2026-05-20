import {
  appRoutes,
  buildCreditCardBillPath,
  buildGoalScenarioPath,
  buildTickerDetailPath,
} from "@/core/navigation/routes";

describe("app routes", () => {
  it("builds a typed goal scenario route object", () => {
    expect(buildGoalScenarioPath("goal-1")).toEqual({
      pathname: "/metas/[id]/simular",
      params: { id: "goal-1" },
    });
  });

  it("builds a typed ticker detail route object with normalized ticker", () => {
    expect(buildTickerDetailPath(" petr4 ")).toEqual({
      pathname: "/carteira/[ticker]",
      params: { ticker: "PETR4" },
    });
  });

  it("builds a typed credit-card bill route object", () => {
    expect(buildCreditCardBillPath("card-1")).toEqual({
      pathname: "/cartoes/[id]/fatura",
      params: { id: "card-1" },
    });
  });

  it("keeps static private routes as direct href strings", () => {
    expect(appRoutes.private.dashboard).toBe("/dashboard");
    expect(appRoutes.private.insights).toBe("/insights");
  });
});
