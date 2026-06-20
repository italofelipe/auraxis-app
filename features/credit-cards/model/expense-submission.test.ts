import {
  type ExpenseFormValues,
  buildExpensePayloads,
} from "@/features/credit-cards/model/expense-submission";

const baseValues = (override: Partial<ExpenseFormValues> = {}): ExpenseFormValues => ({
  title: "Tênis novo",
  amount: 300,
  purchaseDate: "2026-06-20",
  creditCardId: "card-1",
  tagId: "tag-1",
  accountId: null,
  status: "pending",
  mode: "avista",
  installments: 3,
  hasDownPayment: false,
  downPayment: 0,
  description: "",
  ...override,
});

describe("buildExpensePayloads — à vista", () => {
  it("gera um único payload à vista (não parcelado)", () => {
    const payloads = buildExpensePayloads(baseValues({ mode: "avista" }));

    expect(payloads).toHaveLength(1);
    expect(payloads[0]).toEqual({
      title: "Tênis novo",
      amount: "300.00",
      type: "expense",
      dueDate: "2026-06-20",
      status: "pending",
      creditCardId: "card-1",
      tagId: "tag-1",
      accountId: null,
      isInstallment: false,
    });
  });

  it("não inclui o campo impactPolicy (não existe no contrato do app)", () => {
    const payloads = buildExpensePayloads(baseValues());

    expect(payloads[0]).not.toHaveProperty("impactPolicy");
    expect(payloads[0]).not.toHaveProperty("impact_policy");
  });

  it("preserva cartão nulo sem bloquear o lançamento", () => {
    const payloads = buildExpensePayloads(
      baseValues({ creditCardId: null }),
    );

    expect(payloads).toHaveLength(1);
    expect(payloads[0]?.creditCardId).toBeNull();
  });

  it("inclui description apenas quando preenchida (trim)", () => {
    const withDescription = buildExpensePayloads(
      baseValues({ description: "  compra parcelada  " }),
    );
    expect(withDescription[0]?.description).toBe("compra parcelada");

    const withoutDescription = buildExpensePayloads(
      baseValues({ description: "   " }),
    );
    expect(withoutDescription[0]).not.toHaveProperty("description");
  });

  it("faz trim no título", () => {
    const payloads = buildExpensePayloads(baseValues({ title: "  Mercado  " }));
    expect(payloads[0]?.title).toBe("Mercado");
  });
});

describe("buildExpensePayloads — parcelado sem entrada", () => {
  it("gera um único payload parcelado (isInstallment + installmentCount)", () => {
    const payloads = buildExpensePayloads(
      baseValues({ mode: "parcelado", installments: 6, hasDownPayment: false }),
    );

    expect(payloads).toHaveLength(1);
    expect(payloads[0]).toMatchObject({
      amount: "300.00",
      isInstallment: true,
      installmentCount: 6,
      dueDate: "2026-06-20",
    });
  });

  it("trata parcelas em 1 como não parcelado (sem installmentCount)", () => {
    const payloads = buildExpensePayloads(
      baseValues({ mode: "parcelado", installments: 1 }),
    );

    expect(payloads).toHaveLength(1);
    expect(payloads[0]?.isInstallment).toBe(false);
    expect(payloads[0]).not.toHaveProperty("installmentCount");
  });

  it("trunca número de parcelas fracionário", () => {
    const payloads = buildExpensePayloads(
      baseValues({ mode: "parcelado", installments: 4.9 }),
    );

    expect(payloads[0]?.installmentCount).toBe(4);
  });
});

describe("buildExpensePayloads — parcelado com entrada", () => {
  it("gera dois payloads: entrada à vista hoje + restante parcelado", () => {
    const payloads = buildExpensePayloads(
      baseValues({
        amount: 300,
        mode: "parcelado",
        installments: 3,
        hasDownPayment: true,
        downPayment: 60,
      }),
    );

    expect(payloads).toHaveLength(2);
    // Payload #1: entrada à vista (hoje, não parcelado).
    expect(payloads[0]).toMatchObject({
      amount: "60.00",
      isInstallment: false,
      dueDate: "2026-06-20",
    });
    expect(payloads[0]).not.toHaveProperty("installmentCount");
    // Payload #2: restante financiado parcelado.
    expect(payloads[1]).toMatchObject({
      amount: "240.00",
      isInstallment: true,
      installmentCount: 3,
    });
  });

  it("ignora a entrada quando o modo é à vista", () => {
    const payloads = buildExpensePayloads(
      baseValues({
        mode: "avista",
        hasDownPayment: true,
        downPayment: 100,
      }),
    );

    expect(payloads).toHaveLength(1);
    expect(payloads[0]?.amount).toBe("300.00");
    expect(payloads[0]?.isInstallment).toBe(false);
  });

  it("ignora a entrada quando hasDownPayment é falso", () => {
    const payloads = buildExpensePayloads(
      baseValues({
        mode: "parcelado",
        installments: 3,
        hasDownPayment: false,
        downPayment: 100,
      }),
    );

    expect(payloads).toHaveLength(1);
    expect(payloads[0]?.amount).toBe("300.00");
    expect(payloads[0]?.isInstallment).toBe(true);
  });

  it("limita a entrada ao total (entrada == total → 1 payload à vista, sem restante)", () => {
    const payloads = buildExpensePayloads(
      baseValues({
        amount: 300,
        mode: "parcelado",
        installments: 3,
        hasDownPayment: true,
        downPayment: 500,
      }),
    );

    expect(payloads).toHaveLength(1);
    expect(payloads[0]?.amount).toBe("300.00");
    expect(payloads[0]?.isInstallment).toBe(false);
  });
});

describe("buildExpensePayloads — casos limítrofes", () => {
  it("retorna lista vazia quando o total é zero", () => {
    expect(buildExpensePayloads(baseValues({ amount: 0 }))).toEqual([]);
  });

  it("trata valores negativos como zero (lista vazia)", () => {
    expect(buildExpensePayloads(baseValues({ amount: -50 }))).toEqual([]);
  });

  it("ignora entrada negativa (mantém um único payload parcelado)", () => {
    const payloads = buildExpensePayloads(
      baseValues({
        mode: "parcelado",
        installments: 3,
        hasDownPayment: true,
        downPayment: -10,
      }),
    );

    expect(payloads).toHaveLength(1);
    expect(payloads[0]?.amount).toBe("300.00");
    expect(payloads[0]?.isInstallment).toBe(true);
  });

  it("propaga cartão, tag, conta e status para todos os payloads", () => {
    const payloads = buildExpensePayloads(
      baseValues({
        creditCardId: "card-9",
        tagId: "tag-9",
        accountId: "acc-9",
        status: "paid",
        mode: "parcelado",
        installments: 2,
        hasDownPayment: true,
        downPayment: 100,
      }),
    );

    expect(payloads).toHaveLength(2);
    for (const payload of payloads) {
      expect(payload.creditCardId).toBe("card-9");
      expect(payload.tagId).toBe("tag-9");
      expect(payload.accountId).toBe("acc-9");
      expect(payload.status).toBe("paid");
      expect(payload.type).toBe("expense");
    }
  });
});
