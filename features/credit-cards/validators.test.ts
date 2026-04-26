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

  it("rejeita closingDay fora de 1-31", () => {
    expect(() =>
      createCreditCardSchema.parse({ ...baseValid, closingDay: 32 }),
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
});
