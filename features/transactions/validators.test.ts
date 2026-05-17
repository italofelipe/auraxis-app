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
  creditCardId: null,
  isInstallment: false,
  installmentCount: null,
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

  it("aceita despesa parcelada com cartao e quantidade valida", () => {
    const parsed = createTransactionSchema.parse({
      ...validBase,
      creditCardId: "018f3a22-6ec3-7dc2-a93a-1bbdecb02000",
      isInstallment: true,
      installmentCount: 12,
    });

    expect(parsed).toEqual(
      expect.objectContaining({
        creditCardId: "018f3a22-6ec3-7dc2-a93a-1bbdecb02000",
        isInstallment: true,
        installmentCount: 12,
      }),
    );
  });

  it("exige quantidade de parcelas quando despesa parcelada esta ativa", () => {
    expect(() =>
      createTransactionSchema.parse({
        ...validBase,
        creditCardId: "018f3a22-6ec3-7dc2-a93a-1bbdecb02000",
        isInstallment: true,
        installmentCount: null,
      }),
    ).toThrow();
  });

  it("limita quantidade de parcelas entre 2 e 60", () => {
    const creditCardId = "018f3a22-6ec3-7dc2-a93a-1bbdecb02000";

    expect(() =>
      createTransactionSchema.parse({
        ...validBase,
        creditCardId,
        isInstallment: true,
        installmentCount: 1,
      }),
    ).toThrow();
    expect(() =>
      createTransactionSchema.parse({
        ...validBase,
        creditCardId,
        isInstallment: true,
        installmentCount: 61,
      }),
    ).toThrow();
  });

  it("rejeita cartao de credito sem formato uuid", () => {
    expect(() =>
      createTransactionSchema.parse({ ...validBase, creditCardId: "card-1" }),
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
