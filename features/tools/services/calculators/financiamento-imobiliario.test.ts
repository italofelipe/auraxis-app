import { describe, expect, it } from "@jest/globals";
import {
  FINANCIAMENTO_TABLE_YEAR,
  calculateFinanciamento,
  createDefaultFinanciamentoFormState,
  validateFinanciamentoForm,
  type FinanciamentoFormState,
} from "./financiamento-imobiliario";

// ─── validateFinanciamentoForm ────────────────────────────────────────────────

describe("validateFinanciamentoForm", () => {
  it("returns no errors for a fully valid form", () => {
    const form: FinanciamentoFormState = {
      propertyValue: 500000,
      downPaymentPct: 20,
      termMonths: 360,
      annualRatePct: 10.5,
      insuranceMonthly: 100,
      adminFeeMonthly: 25,
    };
    expect(validateFinanciamentoForm(form)).toHaveLength(0);
  });

  it("returns error when propertyValue is null", () => {
    const form = { ...createDefaultFinanciamentoFormState(), annualRatePct: 10 };
    const errors = validateFinanciamentoForm(form);
    expect(errors.some((e) => e.field === "propertyValue")).toBe(true);
  });

  it("returns error when propertyValue is zero", () => {
    const form: FinanciamentoFormState = {
      propertyValue: 0,
      downPaymentPct: 20,
      termMonths: 360,
      annualRatePct: 10,
      insuranceMonthly: 0,
      adminFeeMonthly: 0,
    };
    const errors = validateFinanciamentoForm(form);
    expect(errors.some((e) => e.field === "propertyValue")).toBe(true);
  });

  it("returns error when annualRatePct is null", () => {
    const form = { ...createDefaultFinanciamentoFormState(), propertyValue: 400000 };
    const errors = validateFinanciamentoForm(form);
    expect(errors.some((e) => e.field === "annualRatePct")).toBe(true);
  });

  it("returns error when annualRatePct is zero or negative", () => {
    const form: FinanciamentoFormState = {
      propertyValue: 400000,
      downPaymentPct: 20,
      termMonths: 360,
      annualRatePct: 0,
      insuranceMonthly: 0,
      adminFeeMonthly: 0,
    };
    const errors = validateFinanciamentoForm(form);
    expect(errors.some((e) => e.field === "annualRatePct")).toBe(true);
  });

  it("returns error when termMonths is less than 12", () => {
    const form: FinanciamentoFormState = {
      propertyValue: 400000,
      downPaymentPct: 20,
      termMonths: 6,
      annualRatePct: 10,
      insuranceMonthly: 0,
      adminFeeMonthly: 0,
    };
    const errors = validateFinanciamentoForm(form);
    expect(errors.some((e) => e.field === "termMonths")).toBe(true);
  });

  it("returns error when termMonths exceeds 360", () => {
    const form: FinanciamentoFormState = {
      propertyValue: 400000,
      downPaymentPct: 20,
      termMonths: 361,
      annualRatePct: 10,
      insuranceMonthly: 0,
      adminFeeMonthly: 0,
    };
    const errors = validateFinanciamentoForm(form);
    expect(errors.some((e) => e.field === "termMonths")).toBe(true);
  });

  it("returns error when downPaymentPct is 100 or more", () => {
    const form: FinanciamentoFormState = {
      propertyValue: 400000,
      downPaymentPct: 100,
      termMonths: 360,
      annualRatePct: 10,
      insuranceMonthly: 0,
      adminFeeMonthly: 0,
    };
    const errors = validateFinanciamentoForm(form);
    expect(errors.some((e) => e.field === "downPaymentPct")).toBe(true);
  });

  it("accepts downPaymentPct of 0 (zero down)", () => {
    const form: FinanciamentoFormState = {
      propertyValue: 400000,
      downPaymentPct: 0,
      termMonths: 360,
      annualRatePct: 10,
      insuranceMonthly: 0,
      adminFeeMonthly: 0,
    };
    expect(validateFinanciamentoForm(form)).toHaveLength(0);
  });
});

// ─── calculateFinanciamento — loan amounts ────────────────────────────────────

describe("calculateFinanciamento — loan amounts", () => {
  const baseForm: FinanciamentoFormState = {
    propertyValue: 500000,
    downPaymentPct: 20,
    termMonths: 360,
    annualRatePct: 12,
    insuranceMonthly: 0,
    adminFeeMonthly: 0,
  };

  it("derives loanAmount as propertyValue × (1 − downPaymentPct/100)", () => {
    const { loanAmount } = calculateFinanciamento(baseForm);
    expect(loanAmount).toBeCloseTo(400000, 2);
  });

  it("derives downPayment as propertyValue × downPaymentPct/100", () => {
    const { downPayment } = calculateFinanciamento(baseForm);
    expect(downPayment).toBeCloseTo(100000, 2);
  });

  it("loanAmount equals propertyValue when downPaymentPct is 0", () => {
    const form = { ...baseForm, downPaymentPct: 0 };
    const { loanAmount } = calculateFinanciamento(form);
    expect(loanAmount).toBeCloseTo(500000, 2);
  });
});

// ─── calculateFinanciamento — monthly rate ────────────────────────────────────

describe("calculateFinanciamento — monthly rate", () => {
  it("monthlyRate is correctly derived from annualRatePct using compound formula", () => {
    const form: FinanciamentoFormState = {
      propertyValue: 400000,
      downPaymentPct: 0,
      termMonths: 360,
      annualRatePct: 12,
      insuranceMonthly: 0,
      adminFeeMonthly: 0,
    };
    const { monthlyRate } = calculateFinanciamento(form);
    // (1.12)^(1/12) - 1 ≈ 0.009489
    expect(monthlyRate).toBeCloseTo(0.009489, 5);
  });
});

// ─── calculateFinanciamento — SAC schedule ────────────────────────────────────

describe("calculateFinanciamento — SAC schedule", () => {
  const form: FinanciamentoFormState = {
    propertyValue: 400000,
    downPaymentPct: 0,
    termMonths: 360,
    annualRatePct: 12,
    insuranceMonthly: 0,
    adminFeeMonthly: 0,
  };

  it("SAC schedule has exactly termMonths rows", () => {
    const { sac } = calculateFinanciamento(form);
    expect(sac.schedule).toHaveLength(360);
  });

  it("SAC first payment is greater than SAC last payment (decreasing schedule)", () => {
    const { sac } = calculateFinanciamento(form);
    expect(sac.firstPayment).toBeGreaterThan(sac.lastPayment);
  });

  it("SAC final balance is approximately zero", () => {
    const { sac } = calculateFinanciamento(form);
    const lastRow = sac.schedule[sac.schedule.length - 1];
    expect(lastRow?.balance).toBeCloseTo(0, 0);
  });

  it("SAC totalPaid equals sum of all monthly payments", () => {
    const { sac } = calculateFinanciamento(form);
    const sumPayments = sac.schedule.reduce((acc, r) => acc + r.payment, 0);
    expect(sac.totalPaid).toBeCloseTo(sumPayments, 0);
  });

  it("SAC totalInterest equals sum of all monthly interest charges", () => {
    const { sac } = calculateFinanciamento(form);
    const sumInterest = sac.schedule.reduce((acc, r) => acc + r.interest, 0);
    expect(sac.totalInterest).toBeCloseTo(sumInterest, 0);
  });

  it("SAC includes insurance and admin fee in every payment", () => {
    const formWithFees: FinanciamentoFormState = {
      ...form,
      insuranceMonthly: 100,
      adminFeeMonthly: 50,
    };
    const { sac } = calculateFinanciamento(formWithFees);
    // Every payment must be at least 150 more than the base (amortization + interest)
    const baseResult = calculateFinanciamento(form);
    expect(sac.schedule[0]!.payment).toBeCloseTo(baseResult.sac.schedule[0]!.payment + 150, 0);
  });
});

// ─── calculateFinanciamento — PRICE schedule ──────────────────────────────────

describe("calculateFinanciamento — PRICE schedule", () => {
  const form: FinanciamentoFormState = {
    propertyValue: 400000,
    downPaymentPct: 0,
    termMonths: 360,
    annualRatePct: 12,
    insuranceMonthly: 0,
    adminFeeMonthly: 0,
  };

  it("PRICE schedule has exactly termMonths rows", () => {
    const { price } = calculateFinanciamento(form);
    expect(price.schedule).toHaveLength(360);
  });

  it("PRICE first payment equals last payment (constant base PMT)", () => {
    const { price } = calculateFinanciamento(form);
    // Allow small floating-point delta
    expect(price.firstPayment).toBeCloseTo(price.lastPayment, 1);
  });

  it("PRICE final balance is approximately zero", () => {
    const { price } = calculateFinanciamento(form);
    const lastRow = price.schedule[price.schedule.length - 1];
    expect(lastRow?.balance).toBeCloseTo(0, 0);
  });

  it("PRICE totalPaid is greater than SAC totalPaid", () => {
    const { sac, price } = calculateFinanciamento(form);
    expect(price.totalPaid).toBeGreaterThan(sac.totalPaid);
  });
});

// ─── calculateFinanciamento — CET estimate ────────────────────────────────────

describe("calculateFinanciamento — CET estimate", () => {
  it("cetEstimatedPct is greater than zero", () => {
    const form: FinanciamentoFormState = {
      propertyValue: 500000,
      downPaymentPct: 20,
      termMonths: 360,
      annualRatePct: 10.5,
      insuranceMonthly: 0,
      adminFeeMonthly: 0,
    };
    const { cetEstimatedPct } = calculateFinanciamento(form);
    expect(cetEstimatedPct).toBeGreaterThan(0);
  });

  it("cetEstimatedPct increases when insurance is added", () => {
    const base: FinanciamentoFormState = {
      propertyValue: 500000,
      downPaymentPct: 20,
      termMonths: 360,
      annualRatePct: 10.5,
      insuranceMonthly: 0,
      adminFeeMonthly: 0,
    };
    const withInsurance = { ...base, insuranceMonthly: 200 };
    const { cetEstimatedPct: cet1 } = calculateFinanciamento(base);
    const { cetEstimatedPct: cet2 } = calculateFinanciamento(withInsurance);
    expect(cet2).toBeGreaterThan(cet1);
  });
});

// ─── FINANCIAMENTO_TABLE_YEAR ─────────────────────────────────────────────────

describe("FINANCIAMENTO_TABLE_YEAR", () => {
  it("equals 2025", () => {
    expect(FINANCIAMENTO_TABLE_YEAR).toBe(2025);
  });
});

// ─── createDefaultFinanciamentoFormState ──────────────────────────────────────

describe("createDefaultFinanciamentoFormState", () => {
  it("returns downPaymentPct of 20", () => {
    expect(createDefaultFinanciamentoFormState().downPaymentPct).toBe(20);
  });

  it("returns termMonths of 360", () => {
    expect(createDefaultFinanciamentoFormState().termMonths).toBe(360);
  });

  it("returns null for propertyValue and annualRatePct", () => {
    const form = createDefaultFinanciamentoFormState();
    expect(form.propertyValue).toBeNull();
    expect(form.annualRatePct).toBeNull();
  });
});
