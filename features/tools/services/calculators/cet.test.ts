import { describe, expect, it } from "@jest/globals";

import {
  calculateCet,
  calculateIof,
  createDefaultCetFormState,
  validateCetForm,
  type CetFormState,
} from "./cet";

describe("validateCetForm", () => {
  it("returns errors for all empty required fields", () => {
    const form = createDefaultCetFormState();
    const errors = validateCetForm(form);
    expect(errors).toHaveLength(3);
  });

  it("returns no errors when required fields are filled", () => {
    const form: CetFormState = {
      ...createDefaultCetFormState(),
      loanAmount: 10000,
      nominalMonthlyRatePct: 1.5,
      termMonths: 12,
    };
    expect(validateCetForm(form)).toHaveLength(0);
  });
});

describe("calculateIof", () => {
  it("calculates IOF for a 12-month loan", () => {
    const iof = calculateIof(10000, 12);
    expect(iof).toBeGreaterThan(0);
    expect(iof).toBeLessThanOrEqual(300);
  });

  it("caps IOF at 3%", () => {
    const iof = calculateIof(10000, 120);
    expect(iof).toBe(300);
  });
});

describe("calculateCet", () => {
  it("calculates CET for a basic loan", () => {
    const form: CetFormState = {
      ...createDefaultCetFormState(),
      loanAmount: 10000,
      nominalMonthlyRatePct: 1.5,
      termMonths: 12,
    };
    const result = calculateCet(form);

    expect(result).not.toBeNull();
    expect(result!.cetMonthlyPct).toBeGreaterThan(1.5);
    expect(result!.cetAnnualPct).toBeGreaterThan(result!.nominalAnnualPct);
    expect(result!.totalPaid).toBeGreaterThan(10000);
    expect(result!.cashFlows).toHaveLength(12);
  });

  it("CET is higher when TAC is added", () => {
    const formBase: CetFormState = {
      ...createDefaultCetFormState(),
      loanAmount: 20000,
      nominalMonthlyRatePct: 2,
      termMonths: 24,
    };
    const formWithTac: CetFormState = { ...formBase, tacAmount: 1000 };

    const resultBase = calculateCet(formBase)!;
    const resultTac = calculateCet(formWithTac)!;

    expect(resultTac.cetMonthlyPct).toBeGreaterThan(resultBase.cetMonthlyPct);
  });

  it("CET is higher when insurance is added", () => {
    const formBase: CetFormState = {
      ...createDefaultCetFormState(),
      loanAmount: 20000,
      nominalMonthlyRatePct: 2,
      termMonths: 24,
    };
    const formWithIns: CetFormState = { ...formBase, insuranceMonthly: 50 };

    const resultBase = calculateCet(formBase)!;
    const resultIns = calculateCet(formWithIns)!;

    expect(resultIns.cetMonthlyPct).toBeGreaterThan(resultBase.cetMonthlyPct);
  });

  it("allows IOF override", () => {
    const form: CetFormState = {
      ...createDefaultCetFormState(),
      loanAmount: 10000,
      nominalMonthlyRatePct: 1.5,
      termMonths: 12,
      iofOverride: 500,
    };
    const result = calculateCet(form)!;
    expect(result.iofAmount).toBe(500);
  });

  it("net amount received accounts for all upfront fees", () => {
    const form: CetFormState = {
      ...createDefaultCetFormState(),
      loanAmount: 10000,
      nominalMonthlyRatePct: 1.5,
      termMonths: 12,
      tacAmount: 200,
      appraisalFee: 100,
      iofOverride: 150,
    };
    const result = calculateCet(form)!;
    expect(result.netAmountReceived).toBe(10000 - 200 - 150 - 100);
  });

  it("monthly payment follows Price table", () => {
    const form: CetFormState = {
      ...createDefaultCetFormState(),
      loanAmount: 10000,
      nominalMonthlyRatePct: 1,
      termMonths: 12,
    };
    const result = calculateCet(form)!;
    expect(result.monthlyPayment).toBeCloseTo(888.49, 0);
  });
});
