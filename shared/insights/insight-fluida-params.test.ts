import {
  INSIGHT_SECTION_DIMENSIONS,
  buildInsightFluidaParams,
  parseInsightDimensionParam,
} from "@/shared/insights/insight-fluida-params";

describe("buildInsightFluidaParams", () => {
  it("targets the Fluida insights route", () => {
    const href = buildInsightFluidaParams("transactions");

    expect(href).toMatchObject({ pathname: "/insights" });
  });

  it("carries the dimension as a route param", () => {
    const href = buildInsightFluidaParams("budgets");

    expect(href).toMatchObject({
      pathname: "/insights",
      params: { dimension: "budgets" },
    });
  });

  it.each(INSIGHT_SECTION_DIMENSIONS)(
    "round-trips the %s dimension through build → parse",
    (dimension) => {
      const href = buildInsightFluidaParams(dimension);
      const params = (href as unknown as { params: { dimension: string } })
        .params;

      expect(parseInsightDimensionParam(params.dimension)).toBe(dimension);
    },
  );
});

describe("parseInsightDimensionParam", () => {
  it("returns the matching dimension for a known value", () => {
    expect(parseInsightDimensionParam("goals")).toBe("goals");
    expect(parseInsightDimensionParam("credit_cards")).toBe("credit_cards");
  });

  it("returns undefined for an unknown value", () => {
    expect(parseInsightDimensionParam("wallet")).toBeUndefined();
    expect(parseInsightDimensionParam("nope")).toBeUndefined();
  });

  it("returns undefined for an empty or missing value", () => {
    expect(parseInsightDimensionParam("")).toBeUndefined();
    expect(parseInsightDimensionParam(undefined)).toBeUndefined();
  });

  it("takes the first entry when the router passes an array param", () => {
    expect(parseInsightDimensionParam(["transactions", "goals"])).toBe(
      "transactions",
    );
  });

  it("returns undefined for an empty array param", () => {
    expect(parseInsightDimensionParam([])).toBeUndefined();
  });
});
