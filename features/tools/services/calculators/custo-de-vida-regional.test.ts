import {
  CUSTO_VIDA_REGIONAL_PUBLIC_PATH,
  EXPENSE_CATEGORY_KEYS,
  calculateRegionalCost,
  createDefaultRegionalCostFormState,
  decodeQueryToForm,
  encodeFormToQuery,
  validateRegionalCostForm,
  type RegionalCostFormState,
} from "@/features/tools/services/calculators/custo-de-vida-regional";

const makeForm = (
  overrides: Partial<RegionalCostFormState> = {},
): RegionalCostFormState => ({
  uf: "SP",
  monthlyIncome: 10000,
  housing: 2500,
  transport: 800,
  food: 1500,
  leisure: 700,
  other: 500,
  ...overrides,
});

describe("custo-de-vida-regional calculator", () => {
  it("exposes the canonical web parity path", () => {
    expect(CUSTO_VIDA_REGIONAL_PUBLIC_PATH).toBe("/tools/custo-de-vida-regional");
  });

  it("creates a default state with a valid UF and zeroed expenses", () => {
    const form = createDefaultRegionalCostFormState();
    expect(form.uf).toHaveLength(2);
    expect(form.monthlyIncome).toBe(0);
    for (const key of EXPENSE_CATEGORY_KEYS) {
      expect(form[key]).toBe(0);
    }
  });

  it("validates income, expenses and UF", () => {
    expect(
      validateRegionalCostForm(makeForm({ monthlyIncome: 0 })).some(
        (error) => error.field === "monthlyIncome",
      ),
    ).toBe(true);
    expect(
      validateRegionalCostForm(
        makeForm({ housing: 0, transport: 0, food: 0, leisure: 0, other: 0 }),
      ).some((error) => error.field === "expenses"),
    ).toBe(true);
    expect(
      validateRegionalCostForm(makeForm({ uf: "ZZ" })).some(
        (error) => error.field === "uf",
      ),
    ).toBe(true);
    expect(validateRegionalCostForm(makeForm())).toHaveLength(0);
  });

  it("calculates monthly cost, committed income and regional comparison", () => {
    const result = calculateRegionalCost(makeForm());

    expect(result.totalMonthlyCost).toBe(6000);
    expect(result.totalAnnualCost).toBe(72000);
    expect(result.committedPct).toBe(60);
    expect(result.savingsRatePct).toBe(40);
    expect(result.monthlySavings).toBe(4000);
    expect(result.regional.uf).toBe("SP");
    expect(result.regional.avgIncome).toBeGreaterThan(0);
    expect(result.regional.avgCost).toBeGreaterThan(0);
  });

  it("returns category breakdown, target wealth and years to retirement", () => {
    const result = calculateRegionalCost(makeForm());
    const categoryTotal = result.categories.reduce((sum, item) => sum + item.amount, 0);
    const housing = result.categories.find((item) => item.key === "housing");

    expect(categoryTotal).toBe(result.totalMonthlyCost);
    expect(housing?.pctOfIncome).toBe(25);
    expect(result.targetWealth).toBe(1800000);
    expect(result.yearsToRetirement).not.toBeNull();
    expect(result.sustainabilityScore).toBeGreaterThanOrEqual(0);
    expect(result.sustainabilityScore).toBeLessThanOrEqual(100);
  });

  it("returns null years to retirement when there are no savings", () => {
    const result = calculateRegionalCost(makeForm({ monthlyIncome: 6000 }));

    expect(result.monthlySavings).toBe(0);
    expect(result.yearsToRetirement).toBeNull();
  });

  it("encodes and decodes share payloads", () => {
    const form = makeForm({ uf: "RJ", monthlyIncome: 8000, leisure: 1200 });
    const decoded = decodeQueryToForm(encodeFormToQuery(form));

    expect(decoded).not.toBeNull();
    expect(decoded?.uf).toBe("RJ");
    expect(decoded?.monthlyIncome).toBe(8000);
    expect(decoded?.leisure).toBe(1200);
    expect(decodeQueryToForm("not-base64!!!")).toBeNull();
  });
});
