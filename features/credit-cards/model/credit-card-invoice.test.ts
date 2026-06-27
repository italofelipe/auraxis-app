import type {
  CreditCard,
  CreditCardBillRecord,
} from "@/features/credit-cards/contracts";
import type { Tag } from "@/features/tags/contracts";
import { transactionFixture } from "@/features/transactions/mocks";

import type { EnrichedTransaction } from "./card-transactions";
import {
  buildCreditCardInvoiceViewModel,
  type CreditCardInvoiceParams,
} from "./credit-card-invoice";

const card: CreditCard = {
  id: "card-1",
  name: "Inter padrão",
  brand: "mastercard",
  limitAmount: 25000,
  closingDay: 28,
  dueDay: 10,
  lastFourDigits: "4000",
  bank: "Inter",
  description: null,
  benefits: [],
  validityDate: null,
  createdAt: null,
  updatedAt: null,
};

const tags: readonly Tag[] = [
  { id: "tag-compras", name: "Compras", color: "#9B5DE5", icon: null },
  { id: "tag-viagem", name: "Viagem", color: "#00BBF9", icon: null },
];

const buildTx = (
  overrides: Partial<EnrichedTransaction> = {},
): EnrichedTransaction => {
  const item = {
    id: "tx-1",
    title: "Renner",
    amount: 938.57,
    purchaseDate: "2026-05-05",
    tagId: "tag-compras",
    creditCardId: "card-1",
    billMonth: "2026-05",
    isInstallment: false,
    installmentCount: null,
    installmentGroupId: null,
    status: "paid",
    ...overrides,
  };
  return {
    ...item,
    transaction: overrides.transaction ?? {
      ...transactionFixture,
      id: item.id,
      title: item.title,
      amount: item.amount.toFixed(2),
      dueDate: item.purchaseDate,
      tagId: item.tagId,
      creditCardId: item.creditCardId,
      isInstallment: item.isInstallment,
      installmentCount: item.installmentCount,
      installmentGroupId: item.installmentGroupId,
      status: "paid",
    },
  };
};

const buildBill = (
  overrides: Partial<CreditCardBillRecord> = {},
): CreditCardBillRecord => ({
  cycle: {
    startDate: "2026-04-29",
    endDate: "2026-05-28",
    dueDate: "2026-05-20",
    status: "open",
  },
  transactions: [
    {
      id: "official-1",
      title: "Oficial",
      amount: 8144.01,
      dueDate: "2026-05-05",
      status: "pending",
      type: "expense",
    },
  ],
  totalAmount: 8144.01,
  paidAmount: 0,
  pendingAmount: 8144.01,
  ...overrides,
});

const baseParams = (
  overrides: Partial<CreditCardInvoiceParams> = {},
): CreditCardInvoiceParams => ({
  card,
  transactions: [
    buildTx(),
    buildTx({ id: "tx-2", title: "Apple", amount: 373.07, purchaseDate: "2026-05-02" }),
    buildTx({
      id: "tx-3",
      title: "Latam",
      amount: 1200,
      tagId: "tag-viagem",
      purchaseDate: "2026-05-08",
    }),
    buildTx({ id: "tx-old", amount: 999, billMonth: "2026-04" }),
  ],
  tags,
  bill: null,
  month: "2026-05",
  ...overrides,
});

describe("buildCreditCardInvoiceViewModel — total e status", () => {
  it("usa o total oficial quando há fatura", () => {
    const vm = buildCreditCardInvoiceViewModel(baseParams({ bill: buildBill() }));
    expect(vm.total).toBe(8144.01);
    expect(vm.itemCount).toBe(1);
  });

  it("deriva o total das transações do mês sem fatura oficial", () => {
    const vm = buildCreditCardInvoiceViewModel(baseParams());
    expect(vm.total).toBeCloseTo(2511.64, 2); // 938.57 + 373.07 + 1200
    expect(vm.itemCount).toBe(3);
  });

  it("monta a pílula de status aberta", () => {
    const vm = buildCreditCardInvoiceViewModel(baseParams({ bill: buildBill() }));
    expect(vm.status).toEqual({ label: "Aberta", tone: "open" });
  });

  it("monta a pílula de status fechada", () => {
    const vm = buildCreditCardInvoiceViewModel(
      baseParams({
        bill: buildBill({
          cycle: { ...buildBill().cycle, status: "closed" },
        }),
      }),
    );
    expect(vm.status).toEqual({ label: "Fechada", tone: "closed" });
  });

  it("retorna status null sem fatura oficial", () => {
    const vm = buildCreditCardInvoiceViewModel(baseParams());
    expect(vm.status).toBeNull();
  });

  it("formata o vencimento como DD/MM", () => {
    const vm = buildCreditCardInvoiceViewModel(baseParams({ bill: buildBill() }));
    expect(vm.dueDateLabel).toBe("20/05");
  });

  it("retorna vencimento null sem fatura oficial", () => {
    const vm = buildCreditCardInvoiceViewModel(baseParams());
    expect(vm.dueDateLabel).toBeNull();
  });
});

describe("buildCreditCardInvoiceViewModel — breakdown e agrupamento", () => {
  it("ordena o breakdown por total desc", () => {
    const vm = buildCreditCardInvoiceViewModel(baseParams());
    // Compras = 938.57 + 373.07 = 1311.64 > Viagem = 1200.
    expect(vm.categoryBreakdown[0]?.label).toBe("Compras");
    expect(vm.categoryBreakdown[0]?.value).toBeCloseTo(1311.64, 2);
    expect(vm.categoryBreakdown[1]?.label).toBe("Viagem");
    expect(vm.categoryBreakdown[1]?.value).toBe(1200);
  });

  it("usa o id de categoria, com fallback para não categorizado", () => {
    const vm = buildCreditCardInvoiceViewModel(
      baseParams({
        transactions: [buildTx({ id: "n1", tagId: null, amount: 10 })],
      }),
    );
    expect(vm.categoryBreakdown[0]?.id).toBe("uncategorized");
  });

  it("agrupa os itens por categoria com total da categoria", () => {
    const vm = buildCreditCardInvoiceViewModel(baseParams());
    expect(vm.groupedByCategory[0]?.name).toBe("Compras");
    expect(vm.groupedByCategory[0]?.items).toHaveLength(2);
    expect(vm.groupedByCategory[0]?.total).toBeCloseTo(1311.64, 2);
    expect(vm.groupedByCategory[1]?.name).toBe("Viagem");
    expect(vm.groupedByCategory[1]?.items).toHaveLength(1);
  });

  it("resolve o gradiente da marca", () => {
    const vm = buildCreditCardInvoiceViewModel(baseParams());
    expect(vm.gradient.colors).toHaveLength(2);
  });
});
