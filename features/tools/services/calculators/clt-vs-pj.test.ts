import { describe, expect, it } from "@jest/globals";
import {
  LUCRO_PRESUMIDO_EFFECTIVE_RATE,
  MEI_DAS_SERVICOS,
  MEI_MONTHLY_LIMIT,
  MIN_PROLABORE,
  PJ_REGIMES,
  PJ_TABLE_YEAR,
  PROLABORE_INSS_RATE,
  calculateCltVsPj,
  createDefaultCltVsPjFormState,
  getSimplasRate,
  validateCltVsPjForm,
  type CltVsPjFormState,
} from "./clt-vs-pj";

// ─── Constants ────────────────────────────────────────────────────────────────

describe("CLT vs PJ constants", () => {
  it("PJ_TABLE_YEAR is 2025", () => {
    expect(PJ_TABLE_YEAR).toBe(2025);
  });

  it("MEI monthly limit is 6750", () => {
    expect(MEI_MONTHLY_LIMIT).toBe(6750);
  });

  it("PJ regimes has 3 values", () => {
    expect(PJ_REGIMES).toHaveLength(3);
  });

  it("prolabore INSS rate is 11%", () => {
    expect(PROLABORE_INSS_RATE).toBe(0.11);
  });

  it("minimum prolabore is R$1,518", () => {
    expect(MIN_PROLABORE).toBe(1_518);
  });
});

// ─── getSimplasRate ───────────────────────────────────────────────────────────

describe("getSimplasRate", () => {
  it("returns 6% for revenue up to R$180k/year (R$15k/month)", () => {
    expect(getSimplasRate(10_000)).toBe(0.06);
  });

  it("returns 11.2% for revenue up to R$360k/year (R$30k/month)", () => {
    expect(getSimplasRate(20_000)).toBe(0.112);
  });

  it("returns 13.5% for revenue up to R$720k/year", () => {
    expect(getSimplasRate(50_000)).toBe(0.135);
  });

  it("returns 6% for minimal revenue", () => {
    expect(getSimplasRate(3000)).toBe(0.06);
  });
});

// ─── validateCltVsPjForm ──────────────────────────────────────────────────────

describe("validateCltVsPjForm", () => {
  it("returns no errors for a valid form", () => {
    const form: CltVsPjFormState = {
      cltGrossSalary: 8000,
      cltVT: 200,
      cltVR: 400,
      cltHealthPlan: 0,
      cltPLR: 0,
      dependents: 0,
      pjMonthlyInvoice: 12000,
      pjRegime: "simples",
      pjFixedCosts: 500,
      pjHealthPlan: 0,
      pjPensao: 0,
    };
    expect(validateCltVsPjForm(form)).toHaveLength(0);
  });

  it("returns error when cltGrossSalary is null", () => {
    const form = createDefaultCltVsPjFormState();
    form.pjMonthlyInvoice = 5000;
    const errors = validateCltVsPjForm(form);
    expect(errors.some((e) => e.field === "cltGrossSalary")).toBe(true);
  });

  it("returns error when pjMonthlyInvoice is null", () => {
    const form: CltVsPjFormState = {
      ...createDefaultCltVsPjFormState(),
      cltGrossSalary: 5000,
    };
    const errors = validateCltVsPjForm(form);
    expect(errors.some((e) => e.field === "pjMonthlyInvoice")).toBe(true);
  });

  it("returns error when MEI invoice exceeds monthly limit", () => {
    const form: CltVsPjFormState = {
      ...createDefaultCltVsPjFormState(),
      cltGrossSalary: 3000,
      pjMonthlyInvoice: 7000,
      pjRegime: "mei",
    };
    const errors = validateCltVsPjForm(form);
    expect(errors.some((e) => e.messageKey === "errors.meiLimitExceeded")).toBe(true);
  });

  it("does not return MEI error when invoice is within limit", () => {
    const form: CltVsPjFormState = {
      ...createDefaultCltVsPjFormState(),
      cltGrossSalary: 3000,
      pjMonthlyInvoice: 5000,
      pjRegime: "mei",
    };
    expect(validateCltVsPjForm(form)).toHaveLength(0);
  });
});

// ─── calculateCltVsPj — CLT calculation ──────────────────────────────────────

describe("calculateCltVsPj — CLT calculation", () => {
  it("cltNetMonthly is less than gross salary after deductions", () => {
    const form: CltVsPjFormState = {
      cltGrossSalary: 5000,
      cltVT: 0,
      cltVR: 0,
      cltHealthPlan: 0,
      cltPLR: 0,
      dependents: 0,
      pjMonthlyInvoice: 8000,
      pjRegime: "simples",
      pjFixedCosts: 0,
      pjHealthPlan: 0,
      pjPensao: 0,
    };
    const { cltNetMonthly } = calculateCltVsPj(form);
    expect(cltNetMonthly).toBeLessThan(5000);
    expect(cltNetMonthly).toBeGreaterThan(0);
  });

  it("benefits increase cltNetMonthly", () => {
    const base: CltVsPjFormState = {
      cltGrossSalary: 5000,
      cltVT: 0,
      cltVR: 0,
      cltHealthPlan: 0,
      cltPLR: 0,
      dependents: 0,
      pjMonthlyInvoice: 8000,
      pjRegime: "simples",
      pjFixedCosts: 0,
      pjHealthPlan: 0,
      pjPensao: 0,
    };
    const withBenefits: CltVsPjFormState = {
      ...base,
      cltVT: 300,
      cltVR: 500,
    };
    const { cltNetMonthly: baseNet } = calculateCltVsPj(base);
    const { cltNetMonthly: withNet } = calculateCltVsPj(withBenefits);
    expect(withNet).toBeGreaterThan(baseNet);
  });

  it("cltEmployerTotalCost is 128% of gross salary", () => {
    const form: CltVsPjFormState = {
      cltGrossSalary: 5000,
      cltVT: 0,
      cltVR: 0,
      cltHealthPlan: 0,
      cltPLR: 0,
      dependents: 0,
      pjMonthlyInvoice: 7000,
      pjRegime: "simples",
      pjFixedCosts: 0,
      pjHealthPlan: 0,
      pjPensao: 0,
    };
    const { cltEmployerTotalCost } = calculateCltVsPj(form);
    // gross × (1 + 0.08 + 0.20) = gross × 1.28
    expect(cltEmployerTotalCost).toBeCloseTo(5000 * 1.28, 2);
  });
});

// ─── calculateCltVsPj — PJ MEI ────────────────────────────────────────────────

describe("calculateCltVsPj — PJ MEI", () => {
  it("pjTaxAmount equals MEI_DAS_SERVICOS", () => {
    const form: CltVsPjFormState = {
      cltGrossSalary: 3000,
      cltVT: 0,
      cltVR: 0,
      cltHealthPlan: 0,
      cltPLR: 0,
      dependents: 0,
      pjMonthlyInvoice: 5000,
      pjRegime: "mei",
      pjFixedCosts: 0,
      pjHealthPlan: 0,
      pjPensao: 0,
    };
    const { pjTaxAmount } = calculateCltVsPj(form);
    expect(pjTaxAmount).toBe(MEI_DAS_SERVICOS);
  });
});

// ─── calculateCltVsPj — PJ Simples ────────────────────────────────────────────

describe("calculateCltVsPj — PJ Simples", () => {
  it("pjTaxAmount is 6% of invoice for small invoice", () => {
    const form: CltVsPjFormState = {
      cltGrossSalary: 5000,
      cltVT: 0,
      cltVR: 0,
      cltHealthPlan: 0,
      cltPLR: 0,
      dependents: 0,
      pjMonthlyInvoice: 10_000,
      pjRegime: "simples",
      pjFixedCosts: 0,
      pjHealthPlan: 0,
      pjPensao: 0,
    };
    const { pjTaxAmount } = calculateCltVsPj(form);
    expect(pjTaxAmount).toBeCloseTo(10_000 * 0.06, 2);
  });

  it("breakEvenInvoice satisfies pjNet = cltNet algebraically", () => {
    const form: CltVsPjFormState = {
      cltGrossSalary: 5000,
      cltVT: 0,
      cltVR: 0,
      cltHealthPlan: 0,
      cltPLR: 0,
      dependents: 0,
      pjMonthlyInvoice: 10_000,
      pjRegime: "simples",
      pjFixedCosts: 200,
      pjHealthPlan: 0,
      pjPensao: 0,
    };
    const result = calculateCltVsPj(form);
    // Verify break-even: at breakEvenInvoice, pj net should ≈ clt net
    const taxRate = 0.06;
    const proLaboreInss = MIN_PROLABORE * PROLABORE_INSS_RATE;
    const pjNetAtBreakEven =
      result.breakEvenInvoice * (1 - taxRate) -
      form.pjFixedCosts -
      proLaboreInss;
    expect(pjNetAtBreakEven).toBeCloseTo(result.cltNetMonthly, 1);
  });
});

// ─── calculateCltVsPj — PJ Lucro Presumido ────────────────────────────────────

describe("calculateCltVsPj — PJ Lucro Presumido", () => {
  it("pjTaxAmount is ~14.53% of invoice", () => {
    const form: CltVsPjFormState = {
      cltGrossSalary: 8000,
      cltVT: 0,
      cltVR: 0,
      cltHealthPlan: 0,
      cltPLR: 0,
      dependents: 0,
      pjMonthlyInvoice: 20_000,
      pjRegime: "lucro_presumido",
      pjFixedCosts: 0,
      pjHealthPlan: 0,
      pjPensao: 0,
    };
    const { pjTaxAmount } = calculateCltVsPj(form);
    expect(pjTaxAmount).toBeCloseTo(20_000 * LUCRO_PRESUMIDO_EFFECTIVE_RATE, 2);
  });
});

// ─── calculateCltVsPj — profitability ────────────────────────────────────────

describe("calculateCltVsPj — profitability", () => {
  it("pjIsMoreProfitable is true when invoice is very high vs CLT salary", () => {
    const form: CltVsPjFormState = {
      cltGrossSalary: 4000,
      cltVT: 0,
      cltVR: 0,
      cltHealthPlan: 0,
      cltPLR: 0,
      dependents: 0,
      pjMonthlyInvoice: 20_000,
      pjRegime: "simples",
      pjFixedCosts: 0,
      pjHealthPlan: 0,
      pjPensao: 0,
    };
    const { pjIsMoreProfitable } = calculateCltVsPj(form);
    expect(pjIsMoreProfitable).toBe(true);
  });

  it("monthlyDifference equals abs(pjNet - cltNet)", () => {
    const form: CltVsPjFormState = {
      cltGrossSalary: 5000,
      cltVT: 0,
      cltVR: 0,
      cltHealthPlan: 0,
      cltPLR: 0,
      dependents: 0,
      pjMonthlyInvoice: 8000,
      pjRegime: "simples",
      pjFixedCosts: 0,
      pjHealthPlan: 0,
      pjPensao: 0,
    };
    const { cltNetMonthly, pjNetMonthly, monthlyDifference } = calculateCltVsPj(form);
    expect(monthlyDifference).toBeCloseTo(Math.abs(pjNetMonthly - cltNetMonthly), 2);
  });

  it("pjInssProLabore is 11% of minimum prolabore", () => {
    const form: CltVsPjFormState = {
      cltGrossSalary: 5000,
      cltVT: 0,
      cltVR: 0,
      cltHealthPlan: 0,
      cltPLR: 0,
      dependents: 0,
      pjMonthlyInvoice: 8000,
      pjRegime: "simples",
      pjFixedCosts: 0,
      pjHealthPlan: 0,
      pjPensao: 0,
    };
    const { pjInssProLabore } = calculateCltVsPj(form);
    expect(pjInssProLabore).toBeCloseTo(MIN_PROLABORE * PROLABORE_INSS_RATE, 2);
  });
});
