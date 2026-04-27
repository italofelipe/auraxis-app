import { simulateGoalSchema } from "@/features/goals/validators-simulator";

describe("simulateGoalSchema", () => {
  const baseValid = {
    targetAmount: 100000,
    currentAmount: 5000,
  };

  it("aceita payload minimo valido", () => {
    expect(() => simulateGoalSchema.parse(baseValid)).not.toThrow();
  });

  it("rejeita targetAmount nao positivo", () => {
    expect(() =>
      simulateGoalSchema.parse({ ...baseValid, targetAmount: 0 }),
    ).toThrow();
  });

  it("rejeita currentAmount negativo", () => {
    expect(() =>
      simulateGoalSchema.parse({ ...baseValid, currentAmount: -1 }),
    ).toThrow();
  });

  it("aceita parametros opcionais", () => {
    expect(() =>
      simulateGoalSchema.parse({
        ...baseValid,
        targetDate: "2027-01-01",
        monthlyIncome: 5000,
        monthlyExpenses: 3000,
        monthlyContribution: 1000,
      }),
    ).not.toThrow();
  });

  it("rejeita data invalida", () => {
    expect(() =>
      simulateGoalSchema.parse({ ...baseValid, targetDate: "abc" }),
    ).toThrow();
  });
});
