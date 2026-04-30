import { describe, expect, it } from "@jest/globals";
import {
  FIRE_TABLE_YEAR,
  FIRE_VARIANTS,
  FIRE_SWR_MULTIPLIERS,
  calculateFire,
  createDefaultFireFormState,
  validateFireForm,
  type FireFormState,
} from "./fire";

// ─── Constants ────────────────────────────────────────────────────────────────

describe("FIRE constants", () => {
  it("FIRE_TABLE_YEAR is 2025", () => {
    expect(FIRE_TABLE_YEAR).toBe(2025);
  });

  it("FIRE_VARIANTS contains all four variants", () => {
    expect(FIRE_VARIANTS).toContain("fire");
    expect(FIRE_VARIANTS).toContain("lean_fire");
    expect(FIRE_VARIANTS).toContain("fat_fire");
    expect(FIRE_VARIANTS).toContain("coast_fire");
  });

  it("FIRE SWR multiplier for fire is 25", () => {
    expect(FIRE_SWR_MULTIPLIERS.fire).toBe(25);
  });

  it("FIRE SWR multiplier for lean_fire is 20", () => {
    expect(FIRE_SWR_MULTIPLIERS.lean_fire).toBe(20);
  });

  it("FIRE SWR multiplier for fat_fire is 33", () => {
    expect(FIRE_SWR_MULTIPLIERS.fat_fire).toBe(33);
  });

  it("FIRE SWR multiplier for coast_fire is 25", () => {
    expect(FIRE_SWR_MULTIPLIERS.coast_fire).toBe(25);
  });
});

// ─── validateFireForm ─────────────────────────────────────────────────────────

describe("validateFireForm", () => {
  it("returns no errors for a valid form", () => {
    const form: FireFormState = {
      currentAge: 30,
      retirementAge: 45,
      monthlyExpenses: 5000,
      currentPatrimony: 0,
      expectedReturnPct: 8.0,
      ipcaPct: 4.5,
      variant: "fire",
    };
    expect(validateFireForm(form)).toHaveLength(0);
  });

  it("returns error when retirementAge <= currentAge", () => {
    const form: FireFormState = {
      ...createDefaultFireFormState(),
      currentAge: 40,
      retirementAge: 35,
      monthlyExpenses: 5000,
    };
    const errors = validateFireForm(form);
    expect(errors.some((e) => e.field === "retirementAge")).toBe(true);
  });

  it("returns error when retirementAge equals currentAge", () => {
    const form: FireFormState = {
      ...createDefaultFireFormState(),
      currentAge: 40,
      retirementAge: 40,
      monthlyExpenses: 5000,
    };
    expect(validateFireForm(form).some((e) => e.field === "retirementAge")).toBe(true);
  });

  it("returns error when monthlyExpenses is null", () => {
    const form = createDefaultFireFormState();
    const errors = validateFireForm(form);
    expect(errors.some((e) => e.field === "monthlyExpenses")).toBe(true);
  });

  it("returns error when monthlyExpenses is zero", () => {
    const form: FireFormState = {
      ...createDefaultFireFormState(),
      monthlyExpenses: 0,
    };
    expect(validateFireForm(form).some((e) => e.field === "monthlyExpenses")).toBe(true);
  });

  it("returns error when expectedReturnPct is zero", () => {
    const form: FireFormState = {
      ...createDefaultFireFormState(),
      monthlyExpenses: 5000,
      expectedReturnPct: 0,
    };
    expect(validateFireForm(form).some((e) => e.field === "expectedReturnPct")).toBe(true);
  });
});

// ─── calculateFire — required patrimony ──────────────────────────────────────

describe("calculateFire — required patrimony", () => {
  const baseForm: FireFormState = {
    currentAge: 30,
    retirementAge: 45,
    monthlyExpenses: 5000,
    currentPatrimony: 0,
    expectedReturnPct: 8.0,
    ipcaPct: 4.5,
    variant: "fire",
  };

  it("FIRE requiredPatrimony = monthlyExpenses * 12 * 25 (Rule of 25x)", () => {
    const result = calculateFire(baseForm);
    expect(result.selectedVariant.requiredPatrimony).toBeCloseTo(5000 * 12 * 25, 0);
  });

  it("Lean FIRE requiredPatrimony = monthlyExpenses * 12 * 20", () => {
    const result = calculateFire({ ...baseForm, variant: "lean_fire" });
    expect(result.selectedVariant.requiredPatrimony).toBeCloseTo(5000 * 12 * 20, 0);
  });

  it("Fat FIRE requiredPatrimony = monthlyExpenses * 12 * 33", () => {
    const result = calculateFire({ ...baseForm, variant: "fat_fire" });
    expect(result.selectedVariant.requiredPatrimony).toBeCloseTo(5000 * 12 * 33, 0);
  });

  it("allVariants contains all four milestones", () => {
    const result = calculateFire(baseForm);
    expect(result.allVariants).toHaveLength(4);
    const variantKeys = result.allVariants.map((v) => v.variant);
    expect(variantKeys).toContain("fire");
    expect(variantKeys).toContain("lean_fire");
    expect(variantKeys).toContain("fat_fire");
    expect(variantKeys).toContain("coast_fire");
  });

  it("monthsToRetirement = (retirementAge - currentAge) * 12", () => {
    const result = calculateFire(baseForm);
    expect(result.monthsToRetirement).toBe(180);
  });
});

// ─── calculateFire — monthly contribution ────────────────────────────────────

describe("calculateFire — monthly contribution", () => {
  const baseForm: FireFormState = {
    currentAge: 30,
    retirementAge: 45,
    monthlyExpenses: 5000,
    currentPatrimony: 0,
    expectedReturnPct: 8.0,
    ipcaPct: 4.5,
    variant: "fire",
  };

  it("requiredMonthlyContribution is positive when patrimony < target", () => {
    expect(calculateFire(baseForm).selectedVariant.requiredMonthlyContribution).toBeGreaterThan(0);
  });

  it("requiredMonthlyContribution is 0 when currentPatrimony already exceeds target", () => {
    const result = calculateFire({
      ...baseForm,
      currentPatrimony: 5_000_000,
    });
    expect(result.selectedVariant.requiredMonthlyContribution).toBe(0);
  });

  it("more time → lower required monthly contribution", () => {
    const early = calculateFire({ ...baseForm, currentAge: 25 });
    const late = calculateFire({ ...baseForm, currentAge: 38 });
    expect(early.selectedVariant.requiredMonthlyContribution)
      .toBeLessThan(late.selectedVariant.requiredMonthlyContribution);
  });

  it("higher return → lower required monthly contribution", () => {
    const lowReturn = calculateFire({ ...baseForm, expectedReturnPct: 6 });
    const highReturn = calculateFire({ ...baseForm, expectedReturnPct: 12 });
    expect(highReturn.selectedVariant.requiredMonthlyContribution)
      .toBeLessThan(lowReturn.selectedVariant.requiredMonthlyContribution);
  });

  it("lean_fire contribution is less than standard fire contribution", () => {
    const fireMilestone = calculateFire(baseForm).selectedVariant;
    const leanMilestone = calculateFire({ ...baseForm, variant: "lean_fire" }).selectedVariant;
    expect(leanMilestone.requiredMonthlyContribution)
      .toBeLessThan(fireMilestone.requiredMonthlyContribution);
  });

  it("fat_fire contribution is greater than standard fire contribution", () => {
    const fireMilestone = calculateFire(baseForm).selectedVariant;
    const fatMilestone = calculateFire({ ...baseForm, variant: "fat_fire" }).selectedVariant;
    expect(fatMilestone.requiredMonthlyContribution)
      .toBeGreaterThan(fireMilestone.requiredMonthlyContribution);
  });
});

// ─── calculateFire — coast FIRE ───────────────────────────────────────────────

describe("calculateFire — coast FIRE number", () => {
  const baseForm: FireFormState = {
    currentAge: 30,
    retirementAge: 45,
    monthlyExpenses: 5000,
    currentPatrimony: 0,
    expectedReturnPct: 8.0,
    ipcaPct: 4.5,
    variant: "coast_fire",
  };

  it("coastNumber is less than the FIRE number (discounted)", () => {
    const result = calculateFire(baseForm);
    const fireNumber = 5000 * 12 * 25;
    expect(result.coastNumber).toBeLessThan(fireNumber);
  });

  it("coastNumber is positive", () => {
    expect(calculateFire(baseForm).coastNumber).toBeGreaterThan(0);
  });
});

// ─── calculateFire — chart data ───────────────────────────────────────────────

describe("calculateFire — chart data", () => {
  const baseForm: FireFormState = {
    currentAge: 30,
    retirementAge: 45,
    monthlyExpenses: 5000,
    currentPatrimony: 0,
    expectedReturnPct: 8.0,
    ipcaPct: 4.5,
    variant: "fire",
  };

  it("chartData starts at currentAge", () => {
    const result = calculateFire(baseForm);
    expect(result.chartData[0]?.age).toBe(30);
  });

  it("chartData ends at retirementAge", () => {
    const result = calculateFire(baseForm);
    const lastPoint = result.chartData[result.chartData.length - 1];
    expect(lastPoint?.age).toBe(45);
  });

  it("chartData patrimony grows monotonically with positive PMT", () => {
    const result = calculateFire(baseForm);
    for (let i = 1; i < result.chartData.length; i++) {
      expect(result.chartData[i]!.patrimony).toBeGreaterThanOrEqual(result.chartData[i - 1]!.patrimony);
    }
  });
});

// ─── calculateFire — real return ──────────────────────────────────────────────

describe("calculateFire — real return", () => {
  it("realReturnPct is less than expectedReturnPct when IPCA > 0", () => {
    const form: FireFormState = {
      currentAge: 30,
      retirementAge: 45,
      monthlyExpenses: 5000,
      currentPatrimony: 0,
      expectedReturnPct: 8.0,
      ipcaPct: 4.5,
      variant: "fire",
    };
    const result = calculateFire(form);
    expect(result.realReturnPct).toBeLessThan(form.expectedReturnPct);
  });

  it("realReturnPct is positive when expectedReturn > IPCA", () => {
    const form: FireFormState = {
      currentAge: 30,
      retirementAge: 45,
      monthlyExpenses: 5000,
      currentPatrimony: 0,
      expectedReturnPct: 8.0,
      ipcaPct: 4.5,
      variant: "fire",
    };
    expect(calculateFire(form).realReturnPct).toBeGreaterThan(0);
  });
});
