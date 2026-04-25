import { savingsRateCalculator } from "@/features/dashboard/services/savings-rate-calculator";

describe("SavingsRateCalculator", () => {
  it("retorna negative quando despesas excedem receitas", () => {
    const assessment = savingsRateCalculator.assess({ incomes: 1000, expenses: 1500 });
    expect(assessment.level).toBe("negative");
    expect(assessment.rate).toBeLessThan(0);
  });

  it("classifica taxa abaixo de 10 por cento como low", () => {
    const assessment = savingsRateCalculator.assess({ incomes: 1000, expenses: 950 });
    expect(assessment.level).toBe("low");
  });

  it("classifica taxa entre 10 e 30 por cento como healthy", () => {
    const assessment = savingsRateCalculator.assess({ incomes: 1000, expenses: 800 });
    expect(assessment.level).toBe("healthy");
    expect(assessment.rate).toBeCloseTo(0.2, 5);
  });

  it("classifica taxa acima de 30 por cento como excellent", () => {
    const assessment = savingsRateCalculator.assess({ incomes: 1000, expenses: 500 });
    expect(assessment.level).toBe("excellent");
    expect(assessment.rate).toBeCloseTo(0.5, 5);
  });

  it("retorna negative quando incomes <= 0", () => {
    expect(savingsRateCalculator.assess({ incomes: 0, expenses: 100 }).level).toBe(
      "negative",
    );
    expect(savingsRateCalculator.assess({ incomes: -10, expenses: 0 }).level).toBe(
      "negative",
    );
  });

  it("trata NaN sem propagar", () => {
    const assessment = savingsRateCalculator.assess({
      incomes: Number.NaN,
      expenses: Number.NaN,
    });
    expect(assessment.level).toBe("negative");
    expect(assessment.rate).toBe(0);
  });
});
