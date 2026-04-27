import {
  onboardingStep1Schema,
  onboardingStep2Schema,
  onboardingStep3Schema,
} from "@/features/onboarding/validators";

describe("onboardingStep1Schema", () => {
  it("aceita payload valido", () => {
    expect(() =>
      onboardingStep1Schema.parse({
        monthlyIncome: 5000,
        investorProfile: "explorador",
      }),
    ).not.toThrow();
  });

  it("rejeita renda negativa", () => {
    expect(() =>
      onboardingStep1Schema.parse({
        monthlyIncome: -1,
        investorProfile: "conservador",
      }),
    ).toThrow();
  });

  it("rejeita perfil invalido", () => {
    expect(() =>
      onboardingStep1Schema.parse({
        monthlyIncome: 0,
        investorProfile: "agressivo",
      }),
    ).toThrow();
  });
});

describe("onboardingStep2Schema", () => {
  const valid = {
    title: "Almoco",
    amount: 50,
    transactionType: "expense" as const,
    dueDate: "2026-04-15",
  };

  it("aceita payload valido", () => {
    expect(() => onboardingStep2Schema.parse(valid)).not.toThrow();
  });

  it("rejeita amount nao positivo", () => {
    expect(() =>
      onboardingStep2Schema.parse({ ...valid, amount: 0 }),
    ).toThrow();
  });

  it("rejeita data invalida", () => {
    expect(() =>
      onboardingStep2Schema.parse({ ...valid, dueDate: "abc" }),
    ).toThrow();
  });
});

describe("onboardingStep3Schema", () => {
  const valid = {
    name: "Reserva",
    targetAmount: 30000,
    targetDate: "2027-01-01",
  };

  it("aceita payload valido", () => {
    expect(() => onboardingStep3Schema.parse(valid)).not.toThrow();
  });

  it("rejeita name vazio", () => {
    expect(() =>
      onboardingStep3Schema.parse({ ...valid, name: "" }),
    ).toThrow();
  });

  it("rejeita targetAmount nao positivo", () => {
    expect(() =>
      onboardingStep3Schema.parse({ ...valid, targetAmount: 0 }),
    ).toThrow();
  });
});
