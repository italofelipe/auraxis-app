import { simulateSalaryIncreaseSchema } from "@/features/user-profile/validators-salary-sim";

describe("simulateSalaryIncreaseSchema", () => {
  const baseValid = {
    baseSalary: 5000,
    baseDate: "2024-01-01",
    discounts: 500,
    targetRealIncrease: 5,
  };

  it("aceita payload valido", () => {
    expect(() => simulateSalaryIncreaseSchema.parse(baseValid)).not.toThrow();
  });

  it("rejeita baseSalary negativo", () => {
    expect(() =>
      simulateSalaryIncreaseSchema.parse({ ...baseValid, baseSalary: -1 }),
    ).toThrow();
  });

  it("rejeita data invalida", () => {
    expect(() =>
      simulateSalaryIncreaseSchema.parse({ ...baseValid, baseDate: "abc" }),
    ).toThrow();
  });

  it("rejeita discounts negativo", () => {
    expect(() =>
      simulateSalaryIncreaseSchema.parse({ ...baseValid, discounts: -10 }),
    ).toThrow();
  });

  it("rejeita targetRealIncrease negativo", () => {
    expect(() =>
      simulateSalaryIncreaseSchema.parse({
        ...baseValid,
        targetRealIncrease: -1,
      }),
    ).toThrow();
  });
});
