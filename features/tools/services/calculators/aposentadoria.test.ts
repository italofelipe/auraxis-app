import { describe, expect, it } from "@jest/globals";

import {
  APOSENTADORIA_TABLE_YEAR,
  calculateAposentadoria,
  createDefaultAposentadoriaFormState,
  validateAposentadoriaForm,
  type AposentadoriaFormState,
} from "./aposentadoria";

const baseForm = (
  overrides: Partial<AposentadoriaFormState> = {},
): AposentadoriaFormState => ({
  ...createDefaultAposentadoriaFormState(),
  desiredMonthlyIncome: 10_000,
  ...overrides,
});

describe("aposentadoria constants", () => {
  it("APOSENTADORIA_TABLE_YEAR is 2025", () => {
    expect(APOSENTADORIA_TABLE_YEAR).toBe(2025);
  });
});

describe("validateAposentadoriaForm", () => {
  it("aceita um formulario padrao com renda alvo", () => {
    expect(validateAposentadoriaForm(baseForm())).toEqual([]);
  });

  it("rejeita idade de aposentadoria menor ou igual a atual", () => {
    const errors = validateAposentadoriaForm(
      baseForm({ currentAge: 60, retirementAge: 60 }),
    );
    expect(errors.some((e) => e.field === "retirementAge")).toBe(true);
  });

  it("exige renda mensal alvo", () => {
    const errors = validateAposentadoriaForm(
      baseForm({ desiredMonthlyIncome: null }),
    );
    expect(errors.some((e) => e.field === "desiredMonthlyIncome")).toBe(true);
  });

  it("exige rentabilidade positiva", () => {
    const errors = validateAposentadoriaForm(baseForm({ expectedReturnPct: 0 }));
    expect(errors.some((e) => e.field === "expectedReturnPct")).toBe(true);
  });

  it("exige expectativa de vida maior que aposentadoria", () => {
    const errors = validateAposentadoriaForm(
      baseForm({ retirementAge: 95, lifeExpectancy: 90, currentAge: 30 }),
    );
    expect(errors.some((e) => e.field === "lifeExpectancy")).toBe(true);
  });
});

describe("calculateAposentadoria", () => {
  it("aplica regra dos 25x sobre a renda anual desejada", () => {
    const result = calculateAposentadoria(baseForm({ desiredMonthlyIncome: 10_000 }));
    expect(result.requiredPatrimony).toBe(3_000_000);
  });

  it("retorna meses ate aposentadoria como horizonte * 12", () => {
    const result = calculateAposentadoria(
      baseForm({ currentAge: 30, retirementAge: 65 }),
    );
    expect(result.monthsToRetirement).toBe(420);
  });

  it("aporte mensal e zero quando ja se tem patrimonio acima do alvo", () => {
    const result = calculateAposentadoria(
      baseForm({ currentPatrimony: 5_000_000 }),
    );
    expect(result.requiredMonthlyContribution).toBe(0);
  });

  it("isOnTrack vira true quando projecao alcanca o alvo", () => {
    const result = calculateAposentadoria(baseForm());
    expect(typeof result.isOnTrack).toBe("boolean");
    expect(result.projectedPatrimony).toBeGreaterThan(0);
  });

  it("chart data gera entrada por idade entre atual e aposentadoria", () => {
    const result = calculateAposentadoria(
      baseForm({ currentAge: 30, retirementAge: 35 }),
    );
    expect(result.chartData).toHaveLength(6);
    expect(result.chartData[0].age).toBe(30);
    expect(result.chartData[5].age).toBe(35);
  });

  it("expoe sensibilidade -5/+5 anos", () => {
    const result = calculateAposentadoria(
      baseForm({ currentAge: 40, retirementAge: 60 }),
    );
    expect(result.sensitivityMinus20pct).toBeGreaterThanOrEqual(0);
    expect(result.sensitivityPlus20pct).toBeGreaterThanOrEqual(0);
    expect(result.sensitivityPlus20pct).toBeGreaterThanOrEqual(
      result.sensitivityMinus20pct,
    );
  });

  it("realReturnPct usa Fisher (juros - inflacao)", () => {
    const result = calculateAposentadoria(
      baseForm({ expectedReturnPct: 8, ipcaPct: 4.5 }),
    );
    expect(result.realReturnPct).toBeCloseTo(3.3493, 2);
  });
});
