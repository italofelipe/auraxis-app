import { createWalletOperationSchema } from "@/features/wallet/validators-operations";

describe("createWalletOperationSchema", () => {
  const baseValid = {
    kind: "buy" as const,
    quantity: 10,
    unitPrice: 5,
    executedAt: "2026-01-01",
    notes: null,
  };

  it("aceita payload minimo valido", () => {
    expect(() => createWalletOperationSchema.parse(baseValid)).not.toThrow();
  });

  it("rejeita kind invalido", () => {
    expect(() =>
      createWalletOperationSchema.parse({ ...baseValid, kind: "swap" }),
    ).toThrow();
  });

  it("rejeita quantidade nao positiva", () => {
    expect(() =>
      createWalletOperationSchema.parse({ ...baseValid, quantity: 0 }),
    ).toThrow();
  });

  it("rejeita preco unitario nao positivo", () => {
    expect(() =>
      createWalletOperationSchema.parse({ ...baseValid, unitPrice: -1 }),
    ).toThrow();
  });

  it("rejeita data invalida", () => {
    expect(() =>
      createWalletOperationSchema.parse({ ...baseValid, executedAt: "not-a-date" }),
    ).toThrow();
  });

  it("aceita notas opcionais", () => {
    expect(() =>
      createWalletOperationSchema.parse({ ...baseValid, notes: "minha nota" }),
    ).not.toThrow();
  });

  it("rejeita notas com mais de 500 caracteres", () => {
    expect(() =>
      createWalletOperationSchema.parse({
        ...baseValid,
        notes: "x".repeat(501),
      }),
    ).toThrow();
  });
});
