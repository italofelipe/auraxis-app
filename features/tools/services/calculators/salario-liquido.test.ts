import { describe, expect, it } from "@jest/globals";

import {
  calculateSalarioLiquido,
  createDefaultSalarioLiquidoFormState,
  validateSalarioLiquidoForm,
  type SalarioLiquidoFormState,
} from "./salario-liquido";

describe("validateSalarioLiquidoForm", () => {
  it("returns error when grossSalary is null", () => {
    const form = createDefaultSalarioLiquidoFormState();
    const errors = validateSalarioLiquidoForm(form);
    expect(errors).toHaveLength(1);
    expect(errors[0]!.field).toBe("grossSalary");
  });

  it("returns no errors when grossSalary is provided", () => {
    const form = { ...createDefaultSalarioLiquidoFormState(), grossSalary: 5000 };
    expect(validateSalarioLiquidoForm(form)).toHaveLength(0);
  });
});

describe("calculateSalarioLiquido", () => {
  it("calculates net salary for a basic R$5000 gross", () => {
    const form: SalarioLiquidoFormState = {
      ...createDefaultSalarioLiquidoFormState(),
      grossSalary: 5000,
    };
    const result = calculateSalarioLiquido(form);

    expect(result.grossSalary).toBe(5000);
    expect(result.inss).toBeGreaterThan(0);
    expect(result.irrf).toBeGreaterThanOrEqual(0);
    expect(result.vtDiscount).toBe(300); // 6% of 5000
    expect(result.netSalary).toBeLessThan(5000);
    expect(result.netSalary).toBe(result.grossSalary - result.totalDeductions);
  });

  it("includes VT discount at 6% by default", () => {
    const form: SalarioLiquidoFormState = {
      ...createDefaultSalarioLiquidoFormState(),
      grossSalary: 3000,
    };
    const result = calculateSalarioLiquido(form);
    expect(result.vtDiscount).toBe(180); // 6% of 3000
  });

  it("skips VT when opted out", () => {
    const form: SalarioLiquidoFormState = {
      ...createDefaultSalarioLiquidoFormState(),
      grossSalary: 3000,
      vtOptOut: true,
    };
    const result = calculateSalarioLiquido(form);
    expect(result.vtDiscount).toBe(0);
  });

  it("applies union contribution as 1 day of salary", () => {
    const form: SalarioLiquidoFormState = {
      ...createDefaultSalarioLiquidoFormState(),
      grossSalary: 3000,
      unionContribution: true,
    };
    const result = calculateSalarioLiquido(form);
    expect(result.unionDiscount).toBe(100); // 3000/30
  });

  it("applies alimony percentage", () => {
    const form: SalarioLiquidoFormState = {
      ...createDefaultSalarioLiquidoFormState(),
      grossSalary: 10000,
      alimonyPct: 30,
    };
    const result = calculateSalarioLiquido(form);
    expect(result.alimonyDiscount).toBe(3000);
  });

  it("calculates employer total cost", () => {
    const form: SalarioLiquidoFormState = {
      ...createDefaultSalarioLiquidoFormState(),
      grossSalary: 5000,
    };
    const result = calculateSalarioLiquido(form);
    expect(result.employerFgts).toBe(400); // 8%
    expect(result.employerInss).toBe(1000); // 20%
    expect(result.employerTotal).toBe(6400); // 5000 + 400 + 1000
  });

  it("includes health plan and VA/VR deductions", () => {
    const form: SalarioLiquidoFormState = {
      ...createDefaultSalarioLiquidoFormState(),
      grossSalary: 5000,
      healthPlanDiscount: 200,
      vaVrDiscount: 100,
    };
    const result = calculateSalarioLiquido(form);
    expect(result.healthPlanDiscount).toBe(200);
    expect(result.vaVrDiscount).toBe(100);
    expect(result.deductions.find((d) => d.label === "Plano de Saúde")?.amount).toBe(200);
    expect(result.deductions.find((d) => d.label === "VA/VR")?.amount).toBe(100);
  });

  it("deductions sum equals totalDeductions", () => {
    const form: SalarioLiquidoFormState = {
      ...createDefaultSalarioLiquidoFormState(),
      grossSalary: 8000,
      dependents: 2,
      healthPlanDiscount: 300,
      vaVrDiscount: 150,
      alimonyPct: 10,
      unionContribution: true,
    };
    const result = calculateSalarioLiquido(form);
    const sumDeductions = result.deductions.reduce((s, d) => s + d.amount, 0);
    expect(Math.abs(sumDeductions - result.totalDeductions)).toBeLessThan(0.02);
  });

  it("handles minimum wage correctly", () => {
    const form: SalarioLiquidoFormState = {
      ...createDefaultSalarioLiquidoFormState(),
      grossSalary: 1518,
    };
    const result = calculateSalarioLiquido(form);
    expect(result.inss).toBe(113.85); // 1518 * 7.5%
    expect(result.irrf).toBe(0); // Below exemption
    expect(result.netSalary).toBeGreaterThan(0);
  });
});
