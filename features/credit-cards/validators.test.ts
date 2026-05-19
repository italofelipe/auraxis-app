import { createCreditCardSchema } from "@/features/credit-cards/validators";

describe("createCreditCardSchema", () => {
  const baseValid = { name: "Nubank Ultravioleta" };

  it("aceita payload minimo valido", () => {
    expect(() => createCreditCardSchema.parse(baseValid)).not.toThrow();
  });

  it("rejeita nome vazio", () => {
    expect(() => createCreditCardSchema.parse({ name: "" })).toThrow();
  });

  it("rejeita brand invalida", () => {
    expect(() =>
      createCreditCardSchema.parse({ ...baseValid, brand: "discover" }),
    ).toThrow();
  });

  it("rejeita closingDay fora de 1-28", () => {
    expect(() =>
      createCreditCardSchema.parse({ ...baseValid, closingDay: 29 }),
    ).toThrow();
  });

  it("rejeita lastFourDigits com 5 digitos", () => {
    expect(() =>
      createCreditCardSchema.parse({ ...baseValid, lastFourDigits: "12345" }),
    ).toThrow();
  });

  it("aceita limitAmount nao negativo", () => {
    expect(() =>
      createCreditCardSchema.parse({ ...baseValid, limitAmount: 5000 }),
    ).not.toThrow();
  });

  it("aceita metadados estendidos do cartao", () => {
    expect(() =>
      createCreditCardSchema.parse({
        ...baseValid,
        bank: "Nubank",
        description: "Cartao principal",
        benefits: ["Cashback 1%", "Sala VIP"],
        validityDate: "2029-12-01",
      }),
    ).not.toThrow();
  });

  it("rejeita benefits acima do limite", () => {
    expect(() =>
      createCreditCardSchema.parse({
        ...baseValid,
        benefits: Array.from({ length: 13 }, (_, index) => `benefit-${index}`),
      }),
    ).toThrow();
  });

  it("rejeita benefit acima de 120 caracteres", () => {
    expect(() =>
      createCreditCardSchema.parse({
        ...baseValid,
        benefits: ["x".repeat(121)],
      }),
    ).toThrow();
  });

  it("rejeita validityDate fora de ISO YYYY-MM-DD", () => {
    expect(() =>
      createCreditCardSchema.parse({ ...baseValid, validityDate: "12/2029" }),
    ).toThrow();
  });

  it("rejeita validityDate inexistente", () => {
    expect(() =>
      createCreditCardSchema.parse({ ...baseValid, validityDate: "2029-02-31" }),
    ).toThrow();
  });
});
