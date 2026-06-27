import type {
  CreditCard,
  CreditCardBillRecord,
  CreditCardUtilizationRecord,
} from "@/features/credit-cards/contracts";
import type { EnrichedTransaction } from "@/features/credit-cards/model/card-transactions";
import { buildStatement } from "@/features/credit-cards/model/credit-card-statement";
import type { Tag } from "@/features/tags/contracts";
import { transactionFixture } from "@/features/transactions/mocks";

/**
 * Monta uma EnrichedTransaction com defaults para os testes.
 *
 * @param partial Campos a sobrescrever.
 * @returns EnrichedTransaction completa.
 */
const etx = (partial: Partial<EnrichedTransaction>): EnrichedTransaction => {
  const item = {
    id: "tx-1",
    title: "Compra",
    amount: 100,
    purchaseDate: "2026-06-02",
    tagId: null,
    creditCardId: "cc-1",
    billMonth: "2026-06",
    isInstallment: false,
    installmentCount: null,
    installmentGroupId: null,
    status: "pending",
    ...partial,
  };
  return {
    ...item,
    transaction: partial.transaction ?? {
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
      status: "pending",
    },
  };
};

/**
 * Monta um CreditCard completo com defaults para os testes.
 *
 * @param partial Campos a sobrescrever.
 * @returns CreditCard completo.
 */
const card = (partial: Partial<CreditCard>): CreditCard => ({
  id: "cc-1",
  name: "Nubank",
  brand: "mastercard",
  limitAmount: 5000,
  closingDay: 3,
  dueDay: 10,
  lastFourDigits: null,
  bank: "Nubank",
  description: null,
  benefits: [],
  validityDate: null,
  createdAt: null,
  updatedAt: null,
  ...partial,
});

const TAGS: Tag[] = [
  { id: "t-food", name: "Alimentação", color: "#11A36B", icon: null },
  { id: "t-transport", name: "Transporte", color: "#2E7CF6", icon: null },
];

const CARDS: CreditCard[] = [
  card({ id: "cc-1", name: "Nubank", closingDay: 3, dueDay: 10, bank: "Nubank" }),
  card({
    id: "cc-2",
    name: "Inter",
    limitAmount: 3000,
    closingDay: 15,
    dueDay: 22,
    bank: "Inter",
  }),
];

const TXS: EnrichedTransaction[] = [
  etx({ id: "a", creditCardId: "cc-1", billMonth: "2026-06", tagId: "t-food", amount: 100 }),
  etx({ id: "b", creditCardId: "cc-2", billMonth: "2026-06", tagId: "t-transport", amount: 50 }),
  etx({ id: "c", creditCardId: "cc-1", billMonth: "2026-05", tagId: "t-food", amount: 30 }),
];

describe("buildStatement — consolidado (todos os cartões)", () => {
  const vm = buildStatement({
    transactions: TXS,
    tags: TAGS,
    cards: CARDS,
    month: "2026-06",
    cardId: null,
  });

  it("soma o total do mês entre os cartões", () => {
    expect(vm.total).toBe(150);
    expect(vm.itemCount).toBe(2);
  });

  it("não tem status por cartão e usa a data de vencimento mais próxima", () => {
    expect(vm.status).toBeNull();
    expect(vm.dueDate).toBe("2026-06-10");
  });

  it("agrupa categorias ordenadas por total", () => {
    expect(vm.categories.map((c) => [c.name, c.total])).toEqual([
      ["Alimentação", 100],
      ["Transporte", 50],
    ]);
  });

  it("constrói uma tendência de 6 meses marcando o mês atual", () => {
    expect(vm.monthlyTrend).toHaveLength(6);
    const current = vm.monthlyTrend.find((p) => p.current);
    expect(current?.month).toBe("2026-06");
    expect(current?.total).toBe(150);
    expect(vm.monthlyTrend.find((p) => p.month === "2026-05")?.total).toBe(30);
  });

  it("deriva a utilização consolidada a partir da soma dos limites", () => {
    expect(vm.limitAmount).toBe(8000);
    expect(vm.utilizationPct).toBeCloseTo((150 / 8000) * 100, 5);
  });

  it("expõe os totais do rail por cartão e o total geral", () => {
    expect(vm.allCardsTotal).toBe(150);
    expect(vm.railTotals).toEqual([
      { cardId: "cc-1", name: "Nubank", total: 100 },
      { cardId: "cc-2", name: "Inter", total: 50 },
    ]);
  });
});

describe("buildStatement — cartão único com fatura oficial", () => {
  const bill: CreditCardBillRecord = {
    cycle: {
      startDate: "2026-05-04",
      endDate: "2026-06-03",
      dueDate: "2026-06-10",
      status: "closed",
    },
    transactions: [
      { id: "x", title: "A", amount: 600, dueDate: "2026-05-20", status: "paid", type: "expense" },
      { id: "y", title: "B", amount: 399, dueDate: "2026-05-22", status: "pending", type: "expense" },
    ],
    totalAmount: 999,
    paidAmount: 600,
    pendingAmount: 399,
  };
  const utilization: CreditCardUtilizationRecord = {
    cycle: bill.cycle,
    committedAmount: 999,
    availableAmount: 4001,
    limitAmount: 5000,
    utilizationPct: 42,
  };

  const vm = buildStatement({
    transactions: TXS,
    tags: TAGS,
    cards: CARDS,
    month: "2026-06",
    cardId: "cc-1",
    bill,
    utilization,
  });

  it("prefere o total e a contagem da fatura oficial", () => {
    expect(vm.total).toBe(999);
    expect(vm.itemCount).toBe(2);
  });

  it("usa o status e o vencimento do ciclo oficial", () => {
    expect(vm.status).toEqual({ label: "Fechada", tone: "closed" });
    expect(vm.dueDate).toBe("2026-06-10");
  });

  it("usa a utilização e o limite oficiais do cartão", () => {
    expect(vm.utilizationPct).toBe(42);
    expect(vm.limitAmount).toBe(5000);
  });

  it("ainda agrupa categorias das transações reais (a fatura não tem categoria)", () => {
    expect(vm.categories.map((c) => c.name)).toEqual(["Alimentação"]);
  });
});

describe("buildStatement — cartão único sem fatura (ciclo derivado)", () => {
  const vm = buildStatement({
    transactions: TXS,
    tags: TAGS,
    cards: CARDS,
    month: "2026-06",
    cardId: "cc-1",
  });

  it("deriva a data de vencimento do ciclo do cartão", () => {
    expect(vm.dueDate).toBe("2026-06-10");
    expect(vm.total).toBe(100);
  });
});
