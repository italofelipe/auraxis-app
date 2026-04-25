import {
  createTransactionSchema,
  normalizeAmount,
  updateTransactionSchema,
} from "@/features/transactions/validators";

const validBase = {
  title: "Aluguel",
  amount: "2300.00",
  type: "expense" as const,
  dueDate: "2026-04-30",
};

describe("createTransactionSchema", () => {
  it("aceita payload minimo valido", () => {
    expect(() => createTransactionSchema.parse(validBase)).not.toThrow();
  });

  it("rejeita amount zero ou negativo", () => {
    expect(() =>
      createTransactionSchema.parse({ ...validBase, amount: "0" }),
    ).toThrow();
    expect(() =>
      createTransactionSchema.parse({ ...validBase, amount: "-10" }),
    ).toThrow();
  });

  it("aceita amount com virgula brasileira", () => {
    expect(() =>
      createTransactionSchema.parse({ ...validBase, amount: "1500,75" }),
    ).not.toThrow();
  });

  it("rejeita amount com mais de duas casas decimais", () => {
    expect(() =>
      createTransactionSchema.parse({ ...validBase, amount: "10.123" }),
    ).toThrow();
  });

  it("rejeita type fora do enum", () => {
    expect(() =>
      createTransactionSchema.parse({ ...validBase, type: "transfer" }),
    ).toThrow();
  });

  it("rejeita dueDate invalida", () => {
    expect(() =>
      createTransactionSchema.parse({ ...validBase, dueDate: "data-bla" }),
    ).toThrow();
  });

  it("rejeita titulo curto", () => {
    expect(() =>
      createTransactionSchema.parse({ ...validBase, title: "A" }),
    ).toThrow();
  });
});

describe("updateTransactionSchema", () => {
  it("aceita patch parcial valido", () => {
    expect(() => updateTransactionSchema.parse({ title: "Novo titulo" })).not.toThrow();
    expect(() => updateTransactionSchema.parse({ status: "paid" })).not.toThrow();
  });

  it("rejeita patch vazio", () => {
    expect(() => updateTransactionSchema.parse({})).toThrow();
  });
});

describe("normalizeAmount", () => {
  it("converte virgula brasileira para ponto e arredonda 2 casas", () => {
    expect(normalizeAmount("1500,5")).toBe("1500.50");
  });

  it("aceita ponto direto", () => {
    expect(normalizeAmount("1500.50")).toBe("1500.50");
  });

  it("retorna entrada original quando nao e numerico", () => {
    expect(normalizeAmount("abc")).toBe("abc");
  });

  it("normaliza milhares com ponto + decimal com virgula", () => {
    expect(normalizeAmount("1.500,75")).toBe("1500.75");
  });
});
