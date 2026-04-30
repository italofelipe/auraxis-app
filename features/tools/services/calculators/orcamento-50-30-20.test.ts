import { describe, expect, it } from "@jest/globals";

import {
  calculateOrcamento,
  createDefaultOrcamentoFormState,
  validateOrcamentoForm,
  type OrcamentoFormState,
} from "./orcamento-50-30-20";

describe("validateOrcamentoForm", () => {
  it("returns error when netIncome is null", () => {
    const form = createDefaultOrcamentoFormState();
    const errors = validateOrcamentoForm(form);
    expect(errors).toHaveLength(1);
    expect(errors[0]!.field).toBe("netIncome");
  });

  it("returns no errors when netIncome is provided", () => {
    const form = { ...createDefaultOrcamentoFormState(), netIncome: 5000 };
    expect(validateOrcamentoForm(form)).toHaveLength(0);
  });
});

describe("calculateOrcamento — simple mode", () => {
  it("distributes R$10000 into 50/30/20", () => {
    const form: OrcamentoFormState = {
      ...createDefaultOrcamentoFormState(),
      netIncome: 10000,
      mode: "simple",
    };
    const result = calculateOrcamento(form);

    expect(result.slices).toHaveLength(3);
    const needs = result.slices.find((s) => s.category === "needs")!;
    const wants = result.slices.find((s) => s.category === "wants")!;
    const investments = result.slices.find((s) => s.category === "investments")!;

    expect(needs.idealAmount).toBe(5000);
    expect(wants.idealAmount).toBe(3000);
    expect(investments.idealAmount).toBe(2000);

    expect(needs.actualAmount).toBeNull();
    expect(result.totalActual).toBeNull();
    expect(result.surplus).toBeNull();
  });
});

describe("calculateOrcamento — detailed mode", () => {
  it("compares actual vs ideal and flags deviations > 10%", () => {
    const form: OrcamentoFormState = {
      ...createDefaultOrcamentoFormState(),
      netIncome: 10000,
      mode: "detailed",
      actualNeeds: 7000,
      actualWants: 2000,
      actualInvestments: 1000,
    };
    const result = calculateOrcamento(form);

    const needs = result.slices.find((s) => s.category === "needs")!;
    expect(needs.actualAmount).toBe(7000);
    expect(needs.actualPct).toBe(70);
    expect(needs.deviationPct).toBe(20);
    expect(needs.alert).toBe(true);

    const wants = result.slices.find((s) => s.category === "wants")!;
    expect(wants.deviationPct).toBe(-10);
    expect(wants.alert).toBe(false);

    expect(result.totalActual).toBe(10000);
    expect(result.surplus).toBe(0);
  });

  it("calculates surplus when actual < income", () => {
    const form: OrcamentoFormState = {
      ...createDefaultOrcamentoFormState(),
      netIncome: 10000,
      mode: "detailed",
      actualNeeds: 4000,
      actualWants: 2000,
      actualInvestments: 1500,
    };
    const result = calculateOrcamento(form);
    expect(result.totalActual).toBe(7500);
    expect(result.surplus).toBe(2500);
  });

  it("calculates negative surplus when overspending", () => {
    const form: OrcamentoFormState = {
      ...createDefaultOrcamentoFormState(),
      netIncome: 5000,
      mode: "detailed",
      actualNeeds: 3500,
      actualWants: 2000,
      actualInvestments: 500,
    };
    const result = calculateOrcamento(form);
    expect(result.surplus).toBe(-1000);
  });
});
