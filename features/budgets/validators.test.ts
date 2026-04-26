import { createBudgetSchema } from "@/features/budgets/validators";

describe("createBudgetSchema", () => {
  const baseValid = { name: "Alimentacao", amount: "1500.00" };

  it("aceita payload minimo valido", () => {
    expect(() => createBudgetSchema.parse(baseValid)).not.toThrow();
  });

  it("rejeita name vazio", () => {
    expect(() => createBudgetSchema.parse({ name: "", amount: "100.00" })).toThrow();
  });

  it("rejeita amount em formato invalido", () => {
    expect(() =>
      createBudgetSchema.parse({ name: "X", amount: "abc" }),
    ).toThrow();
  });

  it("aceita period valido", () => {
    expect(() =>
      createBudgetSchema.parse({ ...baseValid, period: "weekly" }),
    ).not.toThrow();
  });

  it("rejeita period invalido", () => {
    expect(() =>
      createBudgetSchema.parse({ ...baseValid, period: "yearly" }),
    ).toThrow();
  });

  it("rejeita data invalida", () => {
    expect(() =>
      createBudgetSchema.parse({ ...baseValid, startDate: "not-a-date" }),
    ).toThrow();
  });

  it("aceita tagId opcional", () => {
    expect(() =>
      createBudgetSchema.parse({ ...baseValid, tagId: "tag-uuid" }),
    ).not.toThrow();
  });
});
