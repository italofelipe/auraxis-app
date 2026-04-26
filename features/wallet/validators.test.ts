import {
  createWalletEntrySchema,
  updateWalletEntrySchema,
} from "@/features/wallet/validators";

describe("createWalletEntrySchema", () => {
  it("aceita payload minimo valido", () => {
    expect(() =>
      createWalletEntrySchema.parse({ name: "PETR4", assetClass: "stocks" }),
    ).not.toThrow();
  });

  it("rejeita name curto", () => {
    expect(() =>
      createWalletEntrySchema.parse({ name: "A", assetClass: "stocks" }),
    ).toThrow();
  });

  it("rejeita assetClass vazio", () => {
    expect(() =>
      createWalletEntrySchema.parse({ name: "Acao", assetClass: "" }),
    ).toThrow();
  });

  it("aceita valores opcionais (value, quantity, annualRate, targetWithdrawDate)", () => {
    expect(() =>
      createWalletEntrySchema.parse({
        name: "Tesouro",
        assetClass: "fixed-income",
        value: 1000,
        quantity: null,
        annualRate: 0.12,
        targetWithdrawDate: "2026-12-31",
      }),
    ).not.toThrow();
  });

  it("rejeita value negativo", () => {
    expect(() =>
      createWalletEntrySchema.parse({
        name: "X",
        assetClass: "stocks",
        value: -1,
      }),
    ).toThrow();
  });

  it("rejeita annualRate fora do intervalo permitido", () => {
    expect(() =>
      createWalletEntrySchema.parse({
        name: "X",
        assetClass: "stocks",
        annualRate: 50,
      }),
    ).toThrow();
  });
});

describe("updateWalletEntrySchema", () => {
  it("aceita patch parcial valido", () => {
    expect(() =>
      updateWalletEntrySchema.parse({ value: 200 }),
    ).not.toThrow();
  });

  it("rejeita patch vazio", () => {
    expect(() => updateWalletEntrySchema.parse({})).toThrow();
  });
});
