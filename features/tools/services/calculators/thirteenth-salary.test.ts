import { describe, expect, it } from "@jest/globals";
import {
  calculateThirteenthSalary,
  createDefaultThirteenthSalaryFormState,
  validateThirteenthSalaryForm,
  type ThirteenthSalaryFormState,
} from "./thirteenth-salary";

describe("validateThirteenthSalaryForm", () => {
  it("returns no errors for valid state", () => {
    const form: ThirteenthSalaryFormState = {
      grossSalary: 5_000,
      monthsWorked: 12,
      variablePay: 0,
      advancePaid: 0,
      dependents: 0,
    };
    expect(validateThirteenthSalaryForm(form)).toHaveLength(0);
  });

  it("requires grossSalary to be positive", () => {
    const form = createDefaultThirteenthSalaryFormState();
    const errors = validateThirteenthSalaryForm({ ...form, grossSalary: null });
    expect(errors.some((e) => e.field === "grossSalary")).toBe(true);
  });

  it("requires grossSalary > 0", () => {
    const form = createDefaultThirteenthSalaryFormState();
    const errors = validateThirteenthSalaryForm({ ...form, grossSalary: 0 });
    expect(errors.some((e) => e.field === "grossSalary")).toBe(true);
  });

  it("rejects monthsWorked = 0", () => {
    const form: ThirteenthSalaryFormState = {
      grossSalary: 3_000,
      monthsWorked: 0,
      variablePay: 0,
      advancePaid: 0,
      dependents: 0,
    };
    expect(validateThirteenthSalaryForm(form).some((e) => e.field === "monthsWorked")).toBe(true);
  });

  it("rejects monthsWorked = 13", () => {
    const form: ThirteenthSalaryFormState = {
      grossSalary: 3_000,
      monthsWorked: 13,
      variablePay: 0,
      advancePaid: 0,
      dependents: 0,
    };
    expect(validateThirteenthSalaryForm(form).some((e) => e.field === "monthsWorked")).toBe(true);
  });
});

describe("calculateThirteenthSalary", () => {
  it("calculates full-year gross for 12 months", () => {
    const form: ThirteenthSalaryFormState = {
      grossSalary: 5_000,
      monthsWorked: 12,
      variablePay: 0,
      advancePaid: 0,
      dependents: 0,
    };
    const result = calculateThirteenthSalary(form);
    expect(result.totalGross).toBe(5_000);
  });

  it("calculates proportional gross for 6 months", () => {
    const form: ThirteenthSalaryFormState = {
      grossSalary: 6_000,
      monthsWorked: 6,
      variablePay: 0,
      advancePaid: 0,
      dependents: 0,
    };
    const result = calculateThirteenthSalary(form);
    expect(result.totalGross).toBe(3_000);
  });

  it("includes variablePay in the calculation base", () => {
    const form: ThirteenthSalaryFormState = {
      grossSalary: 4_000,
      monthsWorked: 12,
      variablePay: 1_000,
      advancePaid: 0,
      dependents: 0,
    };
    const result = calculateThirteenthSalary(form);
    expect(result.totalGross).toBe(5_000);
  });

  it("subtracts advance already paid from gross", () => {
    const form: ThirteenthSalaryFormState = {
      grossSalary: 5_000,
      monthsWorked: 12,
      variablePay: 0,
      advancePaid: 1_000,
      dependents: 0,
    };
    const result = calculateThirteenthSalary(form);
    expect(result.totalGross).toBe(4_000);
  });

  it("first installment has no INSS and no IRRF", () => {
    const form: ThirteenthSalaryFormState = {
      grossSalary: 5_000,
      monthsWorked: 12,
      variablePay: 0,
      advancePaid: 0,
      dependents: 0,
    };
    const { firstInstallment } = calculateThirteenthSalary(form);
    expect(firstInstallment.inss).toBe(0);
    expect(firstInstallment.irrf).toBe(0);
    expect(firstInstallment.net).toBe(firstInstallment.gross);
  });

  it("second installment bears all INSS and IRRF", () => {
    const form: ThirteenthSalaryFormState = {
      grossSalary: 5_000,
      monthsWorked: 12,
      variablePay: 0,
      advancePaid: 0,
      dependents: 0,
    };
    const { secondInstallment, totalInss, totalIrrf } =
      calculateThirteenthSalary(form);
    expect(secondInstallment.inss).toBe(totalInss);
    expect(secondInstallment.irrf).toBe(totalIrrf);
  });

  it("totalNet = totalGross - totalInss - totalIrrf", () => {
    const form: ThirteenthSalaryFormState = {
      grossSalary: 8_000,
      monthsWorked: 12,
      variablePay: 0,
      advancePaid: 0,
      dependents: 1,
    };
    const result = calculateThirteenthSalary(form);
    expect(result.totalNet).toBeCloseTo(
      result.totalGross - result.totalInss - result.totalIrrf,
      2,
    );
  });

  it("salary below exemption threshold has zero IRRF", () => {
    const form: ThirteenthSalaryFormState = {
      grossSalary: 1_500,
      monthsWorked: 12,
      variablePay: 0,
      advancePaid: 0,
      dependents: 0,
    };
    const result = calculateThirteenthSalary(form);
    expect(result.totalIrrf).toBe(0);
  });

  it("does not produce negative totalGross when advance exceeds base", () => {
    const form: ThirteenthSalaryFormState = {
      grossSalary: 2_000,
      monthsWorked: 12,
      variablePay: 0,
      advancePaid: 3_000,
      dependents: 0,
    };
    const result = calculateThirteenthSalary(form);
    expect(result.totalGross).toBe(0);
  });
});
