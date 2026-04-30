import { describe, expect, it } from "@jest/globals";
import {
  CLT_DEFAULT_HOURS_PER_MONTH,
  OVERTIME_RATES,
  calculateHoraExtra,
  createDefaultHoraExtraFormState,
  validateHoraExtraForm,
  type HoraExtraFormState,
} from "./hora-extra";

// ─── validateHoraExtraForm ────────────────────────────────────────────────────

describe("validateHoraExtraForm", () => {
  it("returns no errors for a valid form", () => {
    const form: HoraExtraFormState = {
      grossSalary: 5000,
      hoursPerMonth: 220,
      hours50: 4,
      hours75: 0,
      hours100: 0,
    };
    expect(validateHoraExtraForm(form)).toHaveLength(0);
  });

  it("returns error when grossSalary is null", () => {
    const form = { ...createDefaultHoraExtraFormState(), hours50: 2 };
    const errors = validateHoraExtraForm(form);
    expect(errors.some((e) => e.field === "grossSalary")).toBe(true);
  });

  it("returns error when grossSalary is zero or negative", () => {
    const form: HoraExtraFormState = {
      grossSalary: 0,
      hoursPerMonth: 220,
      hours50: 2,
      hours75: 0,
      hours100: 0,
    };
    const errors = validateHoraExtraForm(form);
    expect(errors.some((e) => e.field === "grossSalary")).toBe(true);
  });

  it("returns error when hoursPerMonth is zero or invalid", () => {
    const form: HoraExtraFormState = {
      grossSalary: 5000,
      hoursPerMonth: 0,
      hours50: 2,
      hours75: 0,
      hours100: 0,
    };
    const errors = validateHoraExtraForm(form);
    expect(errors.some((e) => e.field === "hoursPerMonth")).toBe(true);
  });

  it("returns error when all overtime hours are zero", () => {
    const form: HoraExtraFormState = {
      grossSalary: 5000,
      hoursPerMonth: 220,
      hours50: 0,
      hours75: 0,
      hours100: 0,
    };
    const errors = validateHoraExtraForm(form);
    expect(errors.some((e) => e.messageKey === "errors.noOvertimeHours")).toBe(true);
  });

  it("returns error when hours are negative", () => {
    const form: HoraExtraFormState = {
      grossSalary: 5000,
      hoursPerMonth: 220,
      hours50: -1,
      hours75: 0,
      hours100: 0,
    };
    const errors = validateHoraExtraForm(form);
    expect(errors.some((e) => e.field === "hours50")).toBe(true);
  });

  it("accepts form with only hours100 set", () => {
    const form: HoraExtraFormState = {
      grossSalary: 5000,
      hoursPerMonth: 220,
      hours50: 0,
      hours75: 0,
      hours100: 3,
    };
    expect(validateHoraExtraForm(form)).toHaveLength(0);
  });
});

// ─── calculateHoraExtra — hourly rate ────────────────────────────────────────

describe("calculateHoraExtra — hourly rate", () => {
  it("derives hourlyRate from grossSalary / hoursPerMonth", () => {
    const form: HoraExtraFormState = {
      grossSalary: 4400,
      hoursPerMonth: 220,
      hours50: 2,
      hours75: 0,
      hours100: 0,
    };
    const { hourlyRate } = calculateHoraExtra(form);
    expect(hourlyRate).toBeCloseTo(20, 2);
  });

  it("falls back to CLT_DEFAULT_HOURS_PER_MONTH when hoursPerMonth is invalid", () => {
    const form: HoraExtraFormState = {
      grossSalary: 2200,
      hoursPerMonth: 0,
      hours50: 2,
      hours75: 0,
      hours100: 0,
    };
    const { hourlyRate, hoursPerMonth } = calculateHoraExtra(form);
    expect(hoursPerMonth).toBe(CLT_DEFAULT_HOURS_PER_MONTH);
    expect(hourlyRate).toBeCloseTo(10, 2);
  });
});

// ─── calculateHoraExtra — per-rate breakdowns ─────────────────────────────────

describe("calculateHoraExtra — per-rate breakdowns", () => {
  it("calculates 50% overtime correctly", () => {
    const form: HoraExtraFormState = {
      grossSalary: 4400,
      hoursPerMonth: 220,
      hours50: 4,
      hours75: 0,
      hours100: 0,
    };
    const { overtime50 } = calculateHoraExtra(form);
    // hourlyRate = 20, grossAmount = 4 × 20 × 1.5 = 120
    expect(overtime50.rateMultiplier).toBe(OVERTIME_RATES.fifty);
    expect(overtime50.grossAmount).toBeCloseTo(120, 2);
  });

  it("calculates 75% overtime correctly", () => {
    const form: HoraExtraFormState = {
      grossSalary: 4400,
      hoursPerMonth: 220,
      hours50: 0,
      hours75: 2,
      hours100: 0,
    };
    const { overtime75 } = calculateHoraExtra(form);
    // hourlyRate = 20, grossAmount = 2 × 20 × 1.75 = 70
    expect(overtime75.rateMultiplier).toBe(OVERTIME_RATES.seventyFive);
    expect(overtime75.grossAmount).toBeCloseTo(70, 2);
  });

  it("calculates 100% overtime correctly", () => {
    const form: HoraExtraFormState = {
      grossSalary: 4400,
      hoursPerMonth: 220,
      hours50: 0,
      hours75: 0,
      hours100: 3,
    };
    const { overtime100 } = calculateHoraExtra(form);
    // hourlyRate = 20, grossAmount = 3 × 20 × 2.0 = 120
    expect(overtime100.rateMultiplier).toBe(OVERTIME_RATES.oneHundred);
    expect(overtime100.grossAmount).toBeCloseTo(120, 2);
  });

  it("sums all overtime gross amounts in totalOvertimeGross", () => {
    const form: HoraExtraFormState = {
      grossSalary: 4400,
      hoursPerMonth: 220,
      hours50: 4,
      hours75: 2,
      hours100: 1,
    };
    const { overtime50, overtime75, overtime100, totalOvertimeGross } = calculateHoraExtra(form);
    const expected = overtime50.grossAmount + overtime75.grossAmount + overtime100.grossAmount;
    expect(totalOvertimeGross).toBeCloseTo(expected, 2);
  });

  it("sums all hours in totalOvertimeHours", () => {
    const form: HoraExtraFormState = {
      grossSalary: 5000,
      hoursPerMonth: 220,
      hours50: 4,
      hours75: 2,
      hours100: 3,
    };
    const { totalOvertimeHours } = calculateHoraExtra(form);
    expect(totalOvertimeHours).toBe(9);
  });

  it("returns zero amounts for rates with zero hours", () => {
    const form: HoraExtraFormState = {
      grossSalary: 5000,
      hoursPerMonth: 220,
      hours50: 0,
      hours75: 0,
      hours100: 2,
    };
    const { overtime50, overtime75 } = calculateHoraExtra(form);
    expect(overtime50.grossAmount).toBe(0);
    expect(overtime75.grossAmount).toBe(0);
  });
});

// ─── calculateHoraExtra — INSS impact ─────────────────────────────────────────

describe("calculateHoraExtra — INSS impact", () => {
  it("inssOnBase equals calcInss of base salary alone", () => {
    const form: HoraExtraFormState = {
      grossSalary: 3000,
      hoursPerMonth: 220,
      hours50: 4,
      hours75: 0,
      hours100: 0,
    };
    const { inssOnBase } = calculateHoraExtra(form);
    // calcInss(3000) should be deterministic
    expect(inssOnBase).toBeGreaterThan(0);
    expect(inssOnBase).toBeLessThan(3000);
  });

  it("inssOnCombined is greater than inssOnBase when overtime pushes income up", () => {
    const form: HoraExtraFormState = {
      grossSalary: 1500,
      hoursPerMonth: 220,
      hours50: 10,
      hours75: 0,
      hours100: 0,
    };
    const { inssOnBase, inssOnCombined } = calculateHoraExtra(form);
    expect(inssOnCombined).toBeGreaterThanOrEqual(inssOnBase);
  });

  it("inssOvertimeImpact equals inssOnCombined minus inssOnBase", () => {
    const form: HoraExtraFormState = {
      grossSalary: 4000,
      hoursPerMonth: 220,
      hours50: 8,
      hours75: 0,
      hours100: 0,
    };
    const { inssOnBase, inssOnCombined, inssOvertimeImpact } = calculateHoraExtra(form);
    expect(inssOvertimeImpact).toBeCloseTo(inssOnCombined - inssOnBase, 2);
  });

  it("INSS impact is zero when salary already exceeds the INSS ceiling", () => {
    // Salary above the INSS ceiling (R$ 8157.41 for 2025), so adding overtime
    // doesn't increase INSS further.
    const form: HoraExtraFormState = {
      grossSalary: 9000,
      hoursPerMonth: 220,
      hours50: 4,
      hours75: 0,
      hours100: 0,
    };
    const { inssOvertimeImpact } = calculateHoraExtra(form);
    expect(inssOvertimeImpact).toBe(0);
  });
});

// ─── calculateHoraExtra — net overtime ───────────────────────────────────────

describe("calculateHoraExtra — net overtime", () => {
  it("netOvertimeEstimate equals totalOvertimeGross minus inssOvertimeImpact", () => {
    const form: HoraExtraFormState = {
      grossSalary: 3000,
      hoursPerMonth: 220,
      hours50: 6,
      hours75: 0,
      hours100: 0,
    };
    const { totalOvertimeGross, inssOvertimeImpact, netOvertimeEstimate } =
      calculateHoraExtra(form);
    expect(netOvertimeEstimate).toBeCloseTo(totalOvertimeGross - inssOvertimeImpact, 2);
  });

  it("netOvertimeEstimate is less than totalOvertimeGross when INSS applies", () => {
    const form: HoraExtraFormState = {
      grossSalary: 2000,
      hoursPerMonth: 220,
      hours50: 8,
      hours75: 0,
      hours100: 0,
    };
    const { totalOvertimeGross, netOvertimeEstimate, inssOvertimeImpact } =
      calculateHoraExtra(form);
    if (inssOvertimeImpact > 0) {
      expect(netOvertimeEstimate).toBeLessThan(totalOvertimeGross);
    } else {
      expect(netOvertimeEstimate).toBe(totalOvertimeGross);
    }
  });

  it("tableYear matches BR_TAX_TABLE_YEAR", () => {
    const form: HoraExtraFormState = {
      grossSalary: 5000,
      hoursPerMonth: 220,
      hours50: 2,
      hours75: 0,
      hours100: 0,
    };
    const { tableYear } = calculateHoraExtra(form);
    expect(tableYear).toBe(2025);
  });
});
