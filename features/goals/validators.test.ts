import {
  createGoalSchema,
  updateGoalSchema,
} from "@/features/goals/validators";

describe("createGoalSchema", () => {
  it("aceita payload minimo valido", () => {
    expect(() =>
      createGoalSchema.parse({ title: "Casa", targetAmount: 100000 }),
    ).not.toThrow();
  });

  it("rejeita titulo curto", () => {
    expect(() =>
      createGoalSchema.parse({ title: "C", targetAmount: 100 }),
    ).toThrow();
  });

  it("rejeita target zero ou negativo", () => {
    expect(() =>
      createGoalSchema.parse({ title: "Casa", targetAmount: 0 }),
    ).toThrow();
    expect(() =>
      createGoalSchema.parse({ title: "Casa", targetAmount: -5 }),
    ).toThrow();
  });

  it("rejeita currentAmount negativo", () => {
    expect(() =>
      createGoalSchema.parse({
        title: "Casa",
        targetAmount: 100,
        currentAmount: -10,
      }),
    ).toThrow();
  });

  it("aceita targetDate iso valido", () => {
    expect(() =>
      createGoalSchema.parse({
        title: "Casa",
        targetAmount: 100,
        targetDate: "2026-12-31",
      }),
    ).not.toThrow();
  });

  it("rejeita targetDate invalida", () => {
    expect(() =>
      createGoalSchema.parse({
        title: "Casa",
        targetAmount: 100,
        targetDate: "data-bla",
      }),
    ).toThrow();
  });
});

describe("updateGoalSchema", () => {
  it("aceita atualizacao parcial", () => {
    expect(() => updateGoalSchema.parse({ title: "Nova" })).not.toThrow();
    expect(() => updateGoalSchema.parse({ targetAmount: 200 })).not.toThrow();
  });

  it("rejeita payload vazio", () => {
    expect(() => updateGoalSchema.parse({})).toThrow();
  });
});
