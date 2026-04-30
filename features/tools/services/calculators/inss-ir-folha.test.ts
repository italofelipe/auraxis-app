import { describe, expect, it } from "@jest/globals";
import {
  calculateInssIr,
  createDefaultInssIrFormState,
  validateInssIrForm,
  PRIVATE_PENSION_DEDUCTION_LIMIT,
  type InssIrFormState,
} from "./inss-ir-folha";

// ─── validateInssIrForm ────────────────────────────────────────────────────────

describe("validateInssIrForm", () => {
  it("returns no errors for a valid state", () => {
    const form: InssIrFormState = {
      grossSalary: 5_000,
      dependents: 1,
      alimentPension: 0,
      privatePension: 200,
    };
    expect(validateInssIrForm(form)).toHaveLength(0);
  });

  it("requires grossSalary to be present", () => {
    const form = createDefaultInssIrFormState();
    const errors = validateInssIrForm({ ...form, grossSalary: null });
    expect(errors.some((e) => e.field === "grossSalary")).toBe(true);
  });

  it("requires grossSalary > 0", () => {
    const form = createDefaultInssIrFormState();
    const errors = validateInssIrForm({ ...form, grossSalary: 0 });
    expect(errors.some((e) => e.field === "grossSalary")).toBe(true);
  });

  it("rejects negative dependents float", () => {
    const form: InssIrFormState = {
      grossSalary: 3_000,
      dependents: -1,
      alimentPension: 0,
      privatePension: 0,
    };
    expect(validateInssIrForm(form).some((e) => e.field === "dependents")).toBe(true);
  });

  it("rejects fractional dependents", () => {
    const form: InssIrFormState = {
      grossSalary: 3_000,
      dependents: 1.5,
      alimentPension: 0,
      privatePension: 0,
    };
    expect(validateInssIrForm(form).some((e) => e.field === "dependents")).toBe(true);
  });

  it("rejects negative alimentPension", () => {
    const form: InssIrFormState = {
      grossSalary: 3_000,
      dependents: 0,
      alimentPension: -100,
      privatePension: 0,
    };
    expect(validateInssIrForm(form).some((e) => e.field === "alimentPension")).toBe(true);
  });

  it("rejects negative privatePension", () => {
    const form: InssIrFormState = {
      grossSalary: 3_000,
      dependents: 0,
      alimentPension: 0,
      privatePension: -50,
    };
    expect(validateInssIrForm(form).some((e) => e.field === "privatePension")).toBe(true);
  });
});

// ─── calculateInssIr ──────────────────────────────────────────────────────────

describe("calculateInssIr — INSS", () => {
  it("calculates INSS for salary within first bracket only", () => {
    const form: InssIrFormState = {
      grossSalary: 1_000,
      dependents: 0,
      alimentPension: 0,
      privatePension: 0,
    };
    const { totalInss, inssBrackets } = calculateInssIr(form);
    // First bracket: 1000 × 7.5% = 75
    expect(totalInss).toBeCloseTo(75, 2);
    expect(inssBrackets[0]?.isActive).toBe(true);
    expect(inssBrackets[1]?.isActive).toBe(false);
  });

  it("applies progressive INSS across multiple brackets for high salary", () => {
    const form: InssIrFormState = {
      grossSalary: 8_157.41,
      dependents: 0,
      alimentPension: 0,
      privatePension: 0,
    };
    const { inssBrackets } = calculateInssIr(form);
    expect(inssBrackets.every((b) => b.isActive)).toBe(true);
    expect(inssBrackets.every((b) => b.contribution > 0)).toBe(true);
  });

  it("always returns 4 INSS brackets regardless of salary", () => {
    const form = { ...createDefaultInssIrFormState(), grossSalary: 500 };
    const { inssBrackets } = calculateInssIr(form);
    expect(inssBrackets).toHaveLength(4);
  });

  it("INSS bracket contributions sum to totalInss", () => {
    const form: InssIrFormState = {
      grossSalary: 5_000,
      dependents: 0,
      alimentPension: 0,
      privatePension: 0,
    };
    const { inssBrackets, totalInss } = calculateInssIr(form);
    const sum = inssBrackets.reduce((acc, b) => acc + b.contribution, 0);
    // Rounding each bracket independently can differ by up to R$0.01 from the
    // total computed in calcInss (which rounds the aggregate), so we only
    // assert to one decimal place (tolerance ±0.05).
    expect(sum).toBeCloseTo(totalInss, 1);
  });
});

describe("calculateInssIr — IR deductions", () => {
  it("applies dependents deduction to IR base", () => {
    const formNoDependent: InssIrFormState = {
      grossSalary: 5_000,
      dependents: 0,
      alimentPension: 0,
      privatePension: 0,
    };
    const formOneDependent: InssIrFormState = {
      grossSalary: 5_000,
      dependents: 1,
      alimentPension: 0,
      privatePension: 0,
    };
    const { irBase: baseNo } = calculateInssIr(formNoDependent);
    const { irBase: baseOne, dependentsDeduction } = calculateInssIr(formOneDependent);
    expect(dependentsDeduction).toBeCloseTo(189.59, 2);
    expect(baseOne).toBeCloseTo(baseNo - 189.59, 2);
  });

  it("applies full alimentPension deduction", () => {
    const form: InssIrFormState = {
      grossSalary: 5_000,
      dependents: 0,
      alimentPension: 500,
      privatePension: 0,
    };
    const { alimentPensionDeduction, irBase } = calculateInssIr(form);
    expect(alimentPensionDeduction).toBeCloseTo(500, 2);
    const noAliment = calculateInssIr({ ...form, alimentPension: 0 });
    expect(irBase).toBeCloseTo(noAliment.irBase - 500, 2);
  });

  it("caps privatePension deduction at 12% of gross", () => {
    const gross = 5_000;
    const form: InssIrFormState = {
      grossSalary: gross,
      dependents: 0,
      alimentPension: 0,
      privatePension: 2_000, // far above 12% = 600
    };
    const { privatePensionDeduction } = calculateInssIr(form);
    expect(privatePensionDeduction).toBeCloseTo(
      gross * PRIVATE_PENSION_DEDUCTION_LIMIT,
      2,
    );
  });

  it("uses full privatePension when within the 12% limit", () => {
    const gross = 5_000;
    const pension = 300; // 6% of gross — within limit
    const form: InssIrFormState = {
      grossSalary: gross,
      dependents: 0,
      alimentPension: 0,
      privatePension: pension,
    };
    const { privatePensionDeduction } = calculateInssIr(form);
    expect(privatePensionDeduction).toBeCloseTo(pension, 2);
  });
});

describe("calculateInssIr — IRRF", () => {
  it("returns zero IRRF for salary below IR exemption threshold", () => {
    const form: InssIrFormState = {
      grossSalary: 1_500,
      dependents: 0,
      alimentPension: 0,
      privatePension: 0,
    };
    const { totalIrrf } = calculateInssIr(form);
    expect(totalIrrf).toBe(0);
  });

  it("always returns 5 IRRF brackets", () => {
    const form = { ...createDefaultInssIrFormState(), grossSalary: 4_000 };
    const { irrfBrackets } = calculateInssIr(form);
    expect(irrfBrackets).toHaveLength(5);
  });

  it("marks exactly one IRRF bracket as applicable", () => {
    const form: InssIrFormState = {
      grossSalary: 6_000,
      dependents: 0,
      alimentPension: 0,
      privatePension: 0,
    };
    const { irrfBrackets } = calculateInssIr(form);
    const applicable = irrfBrackets.filter((b) => b.isApplicable);
    expect(applicable).toHaveLength(1);
  });

  it("marks no bracket applicable when irBase is zero", () => {
    // grossSalary: null resolves to 0 inside calculateInssIr, which makes
    // irBase = 0.  The bracket logic requires taxableBase > 0, so no bracket
    // should be marked applicable.
    const form: InssIrFormState = {
      grossSalary: null,
      dependents: 0,
      alimentPension: 0,
      privatePension: 0,
    };
    const { irrfBrackets } = calculateInssIr(form);
    expect(irrfBrackets.every((b) => !b.isApplicable)).toBe(true);
  });
});

describe("calculateInssIr — net & effective rate", () => {
  it("netSalary = grossSalary − INSS − IRRF", () => {
    const form: InssIrFormState = {
      grossSalary: 7_000,
      dependents: 1,
      alimentPension: 200,
      privatePension: 400,
    };
    const { netSalary, grossSalary, totalInss, totalIrrf } = calculateInssIr(form);
    expect(netSalary).toBeCloseTo(grossSalary - totalInss - totalIrrf, 2);
  });

  it("effectiveRate = (INSS + IRRF) / gross × 100", () => {
    const form: InssIrFormState = {
      grossSalary: 5_000,
      dependents: 0,
      alimentPension: 0,
      privatePension: 0,
    };
    const { effectiveRate, totalInss, totalIrrf, grossSalary } =
      calculateInssIr(form);
    const expected = ((totalInss + totalIrrf) / grossSalary) * 100;
    expect(effectiveRate).toBeCloseTo(expected, 2);
  });

  it("returns effectiveRate of 0 when gross salary is 0", () => {
    const form = createDefaultInssIrFormState();
    const { effectiveRate } = calculateInssIr({ ...form, grossSalary: 0 });
    expect(effectiveRate).toBe(0);
  });

  it("netSalary is never greater than grossSalary", () => {
    const form: InssIrFormState = {
      grossSalary: 3_000,
      dependents: 2,
      alimentPension: 0,
      privatePension: 0,
    };
    const { netSalary, grossSalary } = calculateInssIr(form);
    expect(netSalary).toBeLessThanOrEqual(grossSalary);
  });

  it("irBase is never negative", () => {
    const form: InssIrFormState = {
      grossSalary: 2_000,
      dependents: 10,
      alimentPension: 3_000,
      privatePension: 500,
    };
    const { irBase } = calculateInssIr(form);
    expect(irBase).toBeGreaterThanOrEqual(0);
  });

  it("exposes the correct table year", () => {
    const form = { ...createDefaultInssIrFormState(), grossSalary: 3_000 };
    const { tableYear } = calculateInssIr(form);
    expect(tableYear).toBe(2025);
  });
});
