import { survivalIndexCalculator } from "@/features/dashboard/services/survival-index-calculator";

describe("SurvivalIndexCalculator.assess", () => {
  it("retorna danger quando expenses zero", () => {
    const result = survivalIndexCalculator.assess({
      netWorth: 10000,
      monthlyExpenses: 0,
    });
    expect(result.level).toBe("danger");
    expect(result.months).toBeNull();
  });

  it("classifica como tight quando reserva cobre ate 3 meses", () => {
    const result = survivalIndexCalculator.assess({
      netWorth: 6000,
      monthlyExpenses: 2000,
    });
    expect(result.level).toBe("tight");
    expect(result.months).toBe(3);
  });

  it("classifica como comfortable entre 4 e 6 meses", () => {
    const result = survivalIndexCalculator.assess({
      netWorth: 12000,
      monthlyExpenses: 2000,
    });
    expect(result.level).toBe("comfortable");
    expect(result.months).toBe(6);
  });

  it("classifica como robust acima de 6 meses", () => {
    const result = survivalIndexCalculator.assess({
      netWorth: 24000,
      monthlyExpenses: 2000,
    });
    expect(result.level).toBe("robust");
    expect(result.months).toBe(12);
  });

  it("danger quando netWorth negativo ou zero", () => {
    expect(
      survivalIndexCalculator.assess({ netWorth: 0, monthlyExpenses: 1000 }).level,
    ).toBe("danger");
    expect(
      survivalIndexCalculator.assess({ netWorth: -100, monthlyExpenses: 1000 })
        .level,
    ).toBe("danger");
  });

  it("trata NaN sem propagar", () => {
    const result = survivalIndexCalculator.assess({
      netWorth: Number.NaN,
      monthlyExpenses: Number.NaN,
    });
    expect(result.months).toBeNull();
    expect(result.level).toBe("danger");
  });
});
