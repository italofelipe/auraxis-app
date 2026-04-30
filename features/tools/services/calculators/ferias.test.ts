import { describe, expect, it } from "@jest/globals";
import {
  ABONO_DAYS,
  BR_TAX_TABLE_YEAR,
  MIN_REST_DAYS_WITH_ABONO,
  calculateFerias,
  createDefaultFeriasFormState,
  validateFeriasForm,
  type FeriasFormState,
} from "./ferias";

// ─── validateFeriasForm ───────────────────────────────────────────────────────

describe("validateFeriasForm", () => {
  it("returns no errors for a valid form (30 days, no abono)", () => {
    const form: FeriasFormState = {
      grossSalary: 4000,
      vacationDays: 30,
      abonoEnabled: false,
      overtimeAverage: 0,
      dependents: 0,
    };
    expect(validateFeriasForm(form)).toHaveLength(0);
  });

  it("returns no errors for a valid form with abono (20 days)", () => {
    const form: FeriasFormState = {
      grossSalary: 4000,
      vacationDays: 20,
      abonoEnabled: true,
      overtimeAverage: 0,
      dependents: 2,
    };
    expect(validateFeriasForm(form)).toHaveLength(0);
  });

  it("returns error when grossSalary is null", () => {
    const form = { ...createDefaultFeriasFormState() };
    const errors = validateFeriasForm(form);
    expect(errors.some((e) => e.field === "grossSalary")).toBe(true);
  });

  it("returns error when grossSalary is zero or negative", () => {
    const form: FeriasFormState = {
      grossSalary: -100,
      vacationDays: 30,
      abonoEnabled: false,
      overtimeAverage: 0,
      dependents: 0,
    };
    expect(validateFeriasForm(form).some((e) => e.field === "grossSalary")).toBe(true);
  });

  it("returns error when overtimeAverage is negative", () => {
    const form: FeriasFormState = {
      grossSalary: 3000,
      vacationDays: 30,
      abonoEnabled: false,
      overtimeAverage: -200,
      dependents: 0,
    };
    expect(validateFeriasForm(form).some((e) => e.field === "overtimeAverage")).toBe(true);
  });

  it("returns error when dependents is fractional", () => {
    const form: FeriasFormState = {
      grossSalary: 3000,
      vacationDays: 30,
      abonoEnabled: false,
      overtimeAverage: 0,
      dependents: 1.5,
    };
    expect(validateFeriasForm(form).some((e) => e.field === "dependents")).toBe(true);
  });

  it("returns error when abonoEnabled is true with fewer than MIN_REST_DAYS_WITH_ABONO", () => {
    const form: FeriasFormState = {
      grossSalary: 3000,
      vacationDays: 15,
      abonoEnabled: true,
      overtimeAverage: 0,
      dependents: 0,
    };
    const errors = validateFeriasForm(form);
    expect(errors.some((e) => e.field === "abonoEnabled")).toBe(true);
  });

  it("allows abonoEnabled true with exactly MIN_REST_DAYS_WITH_ABONO", () => {
    const form: FeriasFormState = {
      grossSalary: 3000,
      vacationDays: MIN_REST_DAYS_WITH_ABONO,
      abonoEnabled: true,
      overtimeAverage: 0,
      dependents: 0,
    };
    expect(validateFeriasForm(form)).toHaveLength(0);
  });
});

// ─── calculateFerias — daily rate ────────────────────────────────────────────

describe("calculateFerias — daily rate", () => {
  it("derives dailyRate from (grossSalary + overtimeAverage) / 30", () => {
    const form: FeriasFormState = {
      grossSalary: 3000,
      vacationDays: 30,
      abonoEnabled: false,
      overtimeAverage: 0,
      dependents: 0,
    };
    const { dailyRate } = calculateFerias(form);
    expect(dailyRate).toBeCloseTo(100, 2);
  });

  it("includes overtimeAverage in the daily rate base", () => {
    const form: FeriasFormState = {
      grossSalary: 3000,
      vacationDays: 30,
      abonoEnabled: false,
      overtimeAverage: 300,
      dependents: 0,
    };
    const { dailyRate } = calculateFerias(form);
    // (3000 + 300) / 30 = 110
    expect(dailyRate).toBeCloseTo(110, 2);
  });
});

// ─── calculateFerias — vacation pay ──────────────────────────────────────────

describe("calculateFerias — vacation pay", () => {
  it("calculates vacationBasePay as dailyRate × vacationDays", () => {
    const form: FeriasFormState = {
      grossSalary: 3000,
      vacationDays: 30,
      abonoEnabled: false,
      overtimeAverage: 0,
      dependents: 0,
    };
    const { vacationBasePay, dailyRate } = calculateFerias(form);
    expect(vacationBasePay).toBeCloseTo(dailyRate * 30, 2);
  });

  it("calculates constitutionalThird as vacationBasePay / 3", () => {
    const form: FeriasFormState = {
      grossSalary: 3000,
      vacationDays: 30,
      abonoEnabled: false,
      overtimeAverage: 0,
      dependents: 0,
    };
    const { vacationBasePay, constitutionalThird } = calculateFerias(form);
    expect(constitutionalThird).toBeCloseTo(vacationBasePay / 3, 2);
  });

  it("vacationGross = vacationBasePay + constitutionalThird", () => {
    const form: FeriasFormState = {
      grossSalary: 3600,
      vacationDays: 20,
      abonoEnabled: false,
      overtimeAverage: 0,
      dependents: 0,
    };
    const { vacationBasePay, constitutionalThird, vacationGross } = calculateFerias(form);
    expect(vacationGross).toBeCloseTo(vacationBasePay + constitutionalThird, 2);
  });

  it("proportional pay for partial vacation (15 days) is half of 30-day pay", () => {
    const form30: FeriasFormState = {
      grossSalary: 3000,
      vacationDays: 30,
      abonoEnabled: false,
      overtimeAverage: 0,
      dependents: 0,
    };
    const form15: FeriasFormState = { ...form30, vacationDays: 15 };
    const result30 = calculateFerias(form30);
    const result15 = calculateFerias(form15);
    expect(result15.vacationGross).toBeCloseTo(result30.vacationGross / 2, 1);
  });
});

// ─── calculateFerias — abono ──────────────────────────────────────────────────

describe("calculateFerias — abono", () => {
  it("abonoValue is dailyRate × ABONO_DAYS when abonoEnabled", () => {
    const form: FeriasFormState = {
      grossSalary: 3000,
      vacationDays: 20,
      abonoEnabled: true,
      overtimeAverage: 0,
      dependents: 0,
    };
    const { abonoValue, dailyRate } = calculateFerias(form);
    expect(abonoValue).toBeCloseTo(dailyRate * ABONO_DAYS, 2);
  });

  it("abonoValue is zero when abonoEnabled is false", () => {
    const form: FeriasFormState = {
      grossSalary: 3000,
      vacationDays: 30,
      abonoEnabled: false,
      overtimeAverage: 0,
      dependents: 0,
    };
    const { abonoValue } = calculateFerias(form);
    expect(abonoValue).toBe(0);
  });

  it("totalGross equals vacationGross + abonoValue", () => {
    const form: FeriasFormState = {
      grossSalary: 3600,
      vacationDays: 20,
      abonoEnabled: true,
      overtimeAverage: 0,
      dependents: 0,
    };
    const { vacationGross, abonoValue, totalGross } = calculateFerias(form);
    expect(totalGross).toBeCloseTo(vacationGross + abonoValue, 2);
  });
});

// ─── calculateFerias — INSS ───────────────────────────────────────────────────

describe("calculateFerias — INSS", () => {
  it("INSS is calculated on vacationGross, not on totalGross (abono exempt)", () => {
    const formNoAbono: FeriasFormState = {
      grossSalary: 3000,
      vacationDays: 20,
      abonoEnabled: false,
      overtimeAverage: 0,
      dependents: 0,
    };
    const formWithAbono: FeriasFormState = { ...formNoAbono, abonoEnabled: true };
    const resultNo = calculateFerias(formNoAbono);
    const resultWith = calculateFerias(formWithAbono);
    // INSS should be the same regardless of abono (abono is exempt)
    expect(resultWith.inss).toBeCloseTo(resultNo.inss, 2);
  });

  it("INSS is positive for salary above the INSS floor", () => {
    const form: FeriasFormState = {
      grossSalary: 3000,
      vacationDays: 30,
      abonoEnabled: false,
      overtimeAverage: 0,
      dependents: 0,
    };
    const { inss } = calculateFerias(form);
    expect(inss).toBeGreaterThan(0);
  });
});

// ─── calculateFerias — IRRF & deductions ─────────────────────────────────────

describe("calculateFerias — IRRF & deductions", () => {
  it("dependentsDeduction = dependents × IRRF_PER_DEPENDENT_DEDUCTION", () => {
    const form: FeriasFormState = {
      grossSalary: 6000,
      vacationDays: 30,
      abonoEnabled: false,
      overtimeAverage: 0,
      dependents: 2,
    };
    const { dependentsDeduction } = calculateFerias(form);
    // 2 × 189.59 = 379.18
    expect(dependentsDeduction).toBeCloseTo(379.18, 2);
  });

  it("irBase is at least 0", () => {
    const form: FeriasFormState = {
      grossSalary: 1200,
      vacationDays: 10,
      abonoEnabled: false,
      overtimeAverage: 0,
      dependents: 5,
    };
    const { irBase } = calculateFerias(form);
    expect(irBase).toBeGreaterThanOrEqual(0);
  });

  it("no IRRF for low income (below exempt threshold)", () => {
    const form: FeriasFormState = {
      grossSalary: 1500,
      vacationDays: 10,
      abonoEnabled: false,
      overtimeAverage: 0,
      dependents: 0,
    };
    const { irrf } = calculateFerias(form);
    expect(irrf).toBe(0);
  });
});

// ─── calculateFerias — net & effective rate ───────────────────────────────────

describe("calculateFerias — net & effective rate", () => {
  it("netTotal = totalGross − INSS − IRRF", () => {
    const form: FeriasFormState = {
      grossSalary: 5000,
      vacationDays: 30,
      abonoEnabled: false,
      overtimeAverage: 0,
      dependents: 1,
    };
    const { totalGross, inss, irrf, netTotal } = calculateFerias(form);
    expect(netTotal).toBeCloseTo(totalGross - inss - irrf, 2);
  });

  it("effectiveRate = (INSS + IRRF) / totalGross × 100", () => {
    const form: FeriasFormState = {
      grossSalary: 7000,
      vacationDays: 30,
      abonoEnabled: false,
      overtimeAverage: 0,
      dependents: 0,
    };
    const { totalGross, inss, irrf, effectiveRate } = calculateFerias(form);
    const expected = ((inss + irrf) / totalGross) * 100;
    expect(effectiveRate).toBeCloseTo(expected, 1);
  });

  it("netTotal is less than totalGross for high salaries", () => {
    const form: FeriasFormState = {
      grossSalary: 8000,
      vacationDays: 30,
      abonoEnabled: true,
      overtimeAverage: 500,
      dependents: 0,
    };
    const { netTotal, totalGross } = calculateFerias(form);
    expect(netTotal).toBeLessThan(totalGross);
  });

  it("tableYear matches BR_TAX_TABLE_YEAR", () => {
    const form: FeriasFormState = {
      grossSalary: 3000,
      vacationDays: 30,
      abonoEnabled: false,
      overtimeAverage: 0,
      dependents: 0,
    };
    expect(calculateFerias(form).tableYear).toBe(BR_TAX_TABLE_YEAR);
  });
});
