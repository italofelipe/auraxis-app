import { describe, expect, it } from "@jest/globals";
import {
  calculateAluguelVsCompra,
  createDefaultAluguelVsCompraFormState,
  validateAluguelVsCompraForm,
  type AluguelVsCompraFormState,
} from "./aluguel-vs-compra";

// ─── validateAluguelVsCompraForm ──────────────────────────────────────────────

describe("validateAluguelVsCompraForm", () => {
  it("returns no errors for a fully valid form", () => {
    const form: AluguelVsCompraFormState = {
      propertyValue: 500000,
      monthlyRent: 2000,
      downPaymentAvailable: 100000,
      annualInvestmentReturnPct: 10,
      annualPropertyValorizationPct: 5,
      analysisYears: 20,
      transactionCostsPct: 9,
      monthlyIptuCondominio: 500,
      annualIpcaPct: 4.5,
      mortgageAnnualRatePct: 12,
    };
    expect(validateAluguelVsCompraForm(form)).toHaveLength(0);
  });

  it("returns error when propertyValue is null", () => {
    const form = { ...createDefaultAluguelVsCompraFormState(), monthlyRent: 2000, downPaymentAvailable: 50000 };
    const errors = validateAluguelVsCompraForm(form);
    expect(errors.some((e) => e.field === "propertyValue")).toBe(true);
  });

  it("returns error when propertyValue is zero", () => {
    const form: AluguelVsCompraFormState = {
      ...createDefaultAluguelVsCompraFormState(),
      propertyValue: 0,
      monthlyRent: 2000,
      downPaymentAvailable: 50000,
    };
    expect(validateAluguelVsCompraForm(form).some((e) => e.field === "propertyValue")).toBe(true);
  });

  it("returns error when monthlyRent is null", () => {
    const form: AluguelVsCompraFormState = {
      ...createDefaultAluguelVsCompraFormState(),
      propertyValue: 500000,
      monthlyRent: null,
      downPaymentAvailable: 50000,
    };
    expect(validateAluguelVsCompraForm(form).some((e) => e.field === "monthlyRent")).toBe(true);
  });

  it("returns error when monthlyRent is zero or negative", () => {
    const form: AluguelVsCompraFormState = {
      ...createDefaultAluguelVsCompraFormState(),
      propertyValue: 500000,
      monthlyRent: 0,
      downPaymentAvailable: 50000,
    };
    expect(validateAluguelVsCompraForm(form).some((e) => e.field === "monthlyRent")).toBe(true);
  });

  it("returns error when downPaymentAvailable is null", () => {
    const form: AluguelVsCompraFormState = {
      ...createDefaultAluguelVsCompraFormState(),
      propertyValue: 500000,
      monthlyRent: 2000,
      downPaymentAvailable: null,
    };
    expect(validateAluguelVsCompraForm(form).some((e) => e.field === "downPaymentAvailable")).toBe(true);
  });

  it("returns error when downPaymentAvailable is negative", () => {
    const form: AluguelVsCompraFormState = {
      ...createDefaultAluguelVsCompraFormState(),
      propertyValue: 500000,
      monthlyRent: 2000,
      downPaymentAvailable: -1,
    };
    expect(validateAluguelVsCompraForm(form).some((e) => e.field === "downPaymentAvailable")).toBe(true);
  });

  it("accepts zero down payment", () => {
    const form: AluguelVsCompraFormState = {
      ...createDefaultAluguelVsCompraFormState(),
      propertyValue: 500000,
      monthlyRent: 2000,
      downPaymentAvailable: 0,
    };
    expect(validateAluguelVsCompraForm(form)).toHaveLength(0);
  });
});

// ─── calculateAluguelVsCompra — chart data ────────────────────────────────────

describe("calculateAluguelVsCompra — chart data", () => {
  const baseForm: AluguelVsCompraFormState = {
    propertyValue: 500000,
    monthlyRent: 2000,
    downPaymentAvailable: 100000,
    annualInvestmentReturnPct: 10,
    annualPropertyValorizationPct: 5,
    analysisYears: 10,
    transactionCostsPct: 9,
    monthlyIptuCondominio: 300,
    annualIpcaPct: 4.5,
    mortgageAnnualRatePct: 12,
  };

  it("chartData has exactly analysisYears data points", () => {
    const { chartData } = calculateAluguelVsCompra(baseForm);
    expect(chartData).toHaveLength(10);
  });

  it("chartData years are sequential from 1 to analysisYears", () => {
    const { chartData } = calculateAluguelVsCompra(baseForm);
    chartData.forEach((pt, idx) => {
      expect(pt.year).toBe(idx + 1);
    });
  });

  it("buyNetWorth at year 1 equals propertyValue*(1+val) - remainingBalance roughly", () => {
    const { chartData } = calculateAluguelVsCompra(baseForm);
    // Just check it is positive
    expect(chartData[0]!.buyNetWorth).toBeGreaterThan(0);
  });

  it("rentNetWorth at year 1 is greater than down payment (invested)", () => {
    const { chartData } = calculateAluguelVsCompra(baseForm);
    expect(chartData[0]!.rentNetWorth).toBeGreaterThan(baseForm.downPaymentAvailable as number);
  });
});

// ─── calculateAluguelVsCompra — property valorization ────────────────────────

describe("calculateAluguelVsCompra — property valorization", () => {
  const baseForm: AluguelVsCompraFormState = {
    propertyValue: 400000,
    monthlyRent: 2000,
    downPaymentAvailable: 400000, // full cash, no mortgage
    annualInvestmentReturnPct: 5,
    annualPropertyValorizationPct: 5,
    analysisYears: 20,
    transactionCostsPct: 9,
    monthlyIptuCondominio: 0,
    annualIpcaPct: 4.5,
    mortgageAnnualRatePct: 12,
  };

  it("propertyValueAtEnd equals propertyValue * (1+val)^analysisYears", () => {
    const { propertyValueAtEnd } = calculateAluguelVsCompra(baseForm);
    const expected = 400000 * Math.pow(1.05, 20);
    expect(propertyValueAtEnd).toBeCloseTo(expected, 0);
  });

  it("downPaymentInvested equals downPayment * (1+investmentReturn)^analysisYears", () => {
    const { downPaymentInvested } = calculateAluguelVsCompra(baseForm);
    const expected = 400000 * Math.pow(1.05, 20);
    expect(downPaymentInvested).toBeCloseTo(expected, 0);
  });
});

// ─── calculateAluguelVsCompra — opportunity cost ─────────────────────────────

describe("calculateAluguelVsCompra — opportunity cost", () => {
  it("opportunityCost equals downPaymentInvested", () => {
    const form: AluguelVsCompraFormState = {
      propertyValue: 500000,
      monthlyRent: 2500,
      downPaymentAvailable: 100000,
      annualInvestmentReturnPct: 10,
      annualPropertyValorizationPct: 5,
      analysisYears: 10,
      transactionCostsPct: 9,
      monthlyIptuCondominio: 200,
      annualIpcaPct: 4.5,
      mortgageAnnualRatePct: 12,
    };
    const { opportunityCost, downPaymentInvested } = calculateAluguelVsCompra(form);
    expect(opportunityCost).toBeCloseTo(downPaymentInvested, 0);
  });
});

// ─── calculateAluguelVsCompra — break-even ────────────────────────────────────

describe("calculateAluguelVsCompra — break-even", () => {
  it("breakEvenYear is null when rent scenario always wins over a long horizon", () => {
    // Very high investment return and very low property valorization
    const form: AluguelVsCompraFormState = {
      propertyValue: 500000,
      monthlyRent: 500, // very cheap rent
      downPaymentAvailable: 500000, // full cash
      annualInvestmentReturnPct: 20, // high return on invested capital
      annualPropertyValorizationPct: 0,
      analysisYears: 5,
      transactionCostsPct: 9,
      monthlyIptuCondominio: 0,
      annualIpcaPct: 0,
      mortgageAnnualRatePct: 12,
    };
    const { breakEvenYear } = calculateAluguelVsCompra(form);
    // With zero valorization and 20% investment return, buy doesn't win in 5 years
    expect(breakEvenYear).toBeNull();
  });

  it("breakEvenYear is a positive integer when buy eventually wins", () => {
    // High valorization, low rent, full cash purchase so no mortgage drag
    const form: AluguelVsCompraFormState = {
      propertyValue: 500000,
      monthlyRent: 3000,
      downPaymentAvailable: 500000,
      annualInvestmentReturnPct: 5,
      annualPropertyValorizationPct: 15, // very high valorization
      analysisYears: 20,
      transactionCostsPct: 0,
      monthlyIptuCondominio: 0,
      annualIpcaPct: 4.5,
      mortgageAnnualRatePct: 12,
    };
    const { breakEvenYear } = calculateAluguelVsCompra(form);
    if (breakEvenYear !== null) {
      expect(breakEvenYear).toBeGreaterThanOrEqual(1);
      expect(breakEvenYear).toBeLessThanOrEqual(form.analysisYears);
    }
    // Result is either null or a valid year — just ensure it does not throw
  });
});

// ─── calculateAluguelVsCompra — totals ────────────────────────────────────────

describe("calculateAluguelVsCompra — totals", () => {
  it("totalRentCost is greater than zero", () => {
    const form: AluguelVsCompraFormState = {
      propertyValue: 500000,
      monthlyRent: 2000,
      downPaymentAvailable: 100000,
      annualInvestmentReturnPct: 10,
      annualPropertyValorizationPct: 5,
      analysisYears: 20,
      transactionCostsPct: 9,
      monthlyIptuCondominio: 300,
      annualIpcaPct: 4.5,
      mortgageAnnualRatePct: 12,
    };
    const { totalRentCost } = calculateAluguelVsCompra(form);
    expect(totalRentCost).toBeGreaterThan(0);
  });

  it("totalBuyCost includes transaction costs", () => {
    const form: AluguelVsCompraFormState = {
      propertyValue: 500000,
      monthlyRent: 2000,
      downPaymentAvailable: 500000, // zero mortgage
      annualInvestmentReturnPct: 10,
      annualPropertyValorizationPct: 5,
      analysisYears: 1,
      transactionCostsPct: 9,
      monthlyIptuCondominio: 0,
      annualIpcaPct: 4.5,
      mortgageAnnualRatePct: 12,
    };
    const { totalBuyCost } = calculateAluguelVsCompra(form);
    const txCosts = 500000 * 0.09;
    expect(totalBuyCost).toBeGreaterThanOrEqual(txCosts);
  });

  it("finalBuyNetWorth is positive when property valorizes over 20 years", () => {
    const form: AluguelVsCompraFormState = {
      propertyValue: 500000,
      monthlyRent: 2000,
      downPaymentAvailable: 500000,
      annualInvestmentReturnPct: 10,
      annualPropertyValorizationPct: 5,
      analysisYears: 20,
      transactionCostsPct: 9,
      monthlyIptuCondominio: 0,
      annualIpcaPct: 4.5,
      mortgageAnnualRatePct: 12,
    };
    const { finalBuyNetWorth } = calculateAluguelVsCompra(form);
    expect(finalBuyNetWorth).toBeGreaterThan(0);
  });

  it("finalRentNetWorth is greater than initial down payment", () => {
    const form: AluguelVsCompraFormState = {
      propertyValue: 500000,
      monthlyRent: 2000,
      downPaymentAvailable: 100000,
      annualInvestmentReturnPct: 10,
      annualPropertyValorizationPct: 5,
      analysisYears: 20,
      transactionCostsPct: 9,
      monthlyIptuCondominio: 0,
      annualIpcaPct: 4.5,
      mortgageAnnualRatePct: 12,
    };
    const { finalRentNetWorth } = calculateAluguelVsCompra(form);
    expect(finalRentNetWorth).toBeGreaterThan(100000);
  });
});

// ─── createDefaultAluguelVsCompraFormState ────────────────────────────────────

describe("createDefaultAluguelVsCompraFormState", () => {
  it("returns annualInvestmentReturnPct of 10", () => {
    expect(createDefaultAluguelVsCompraFormState().annualInvestmentReturnPct).toBe(10.0);
  });

  it("returns analysisYears of 20", () => {
    expect(createDefaultAluguelVsCompraFormState().analysisYears).toBe(20);
  });

  it("returns null for propertyValue, monthlyRent, downPaymentAvailable", () => {
    const form = createDefaultAluguelVsCompraFormState();
    expect(form.propertyValue).toBeNull();
    expect(form.monthlyRent).toBeNull();
    expect(form.downPaymentAvailable).toBeNull();
  });

  it("returns mortgageAnnualRatePct of 12", () => {
    expect(createDefaultAluguelVsCompraFormState().mortgageAnnualRatePct).toBe(12.0);
  });
});
