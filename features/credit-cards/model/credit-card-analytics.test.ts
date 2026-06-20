import type {
  CreditCard,
  CreditCardUtilizationRecord,
} from "@/features/credit-cards/contracts";
import { buildAnalytics } from "@/features/credit-cards/model/credit-card-analytics";
import type { EnrichedTransaction } from "@/features/credit-cards/model/card-transactions";
import type { Tag } from "@/features/tags/contracts";

/**
 * Monta uma EnrichedTransaction com defaults para os testes.
 *
 * @param partial Campos a sobrescrever.
 * @returns EnrichedTransaction completa.
 */
const etx = (partial: Partial<EnrichedTransaction>): EnrichedTransaction => ({
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
});

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
  etx({ id: "a", creditCardId: "cc-1", billMonth: "2026-06", tagId: "t-food", amount: 200 }),
  etx({ id: "b", creditCardId: "cc-2", billMonth: "2026-06", tagId: "t-transport", amount: 50 }),
  etx({ id: "c", creditCardId: "cc-1", billMonth: "2026-05", tagId: "t-food", amount: 100 }),
];

describe("buildAnalytics — consolidado", () => {
  const vm = buildAnalytics({
    transactions: TXS,
    tags: TAGS,
    cards: CARDS,
    month: "2026-06",
    cardId: null,
  });

  it("calcula o KPI de total da fatura do mês", () => {
    expect(vm.kpis.billTotal).toBe(250);
  });

  it("calcula a variação contra o mês anterior", () => {
    // junho 250 vs maio 100 → +150 (+150%).
    expect(vm.kpis.variation).toEqual({ delta: 150, pct: 150 });
  });

  it("destaca a categoria de maior gasto", () => {
    expect(vm.kpis.topCategory?.name).toBe("Alimentação");
    expect(vm.kpis.topCategory?.total).toBe(200);
  });

  it("calcula o uso de limite consolidado", () => {
    expect(vm.kpis.limitUsedPct).toBeCloseTo((250 / 8000) * 100, 5);
  });

  it("constrói uma série de 6 meses por cartão", () => {
    expect(vm.monthlySeries.months).toHaveLength(6);
    const nubank = vm.monthlySeries.series.find((s) => s.cardId === "cc-1");
    const may = vm.monthlySeries.months.indexOf("2026-05");
    const june = vm.monthlySeries.months.indexOf("2026-06");
    expect(nubank?.values[may]).toBe(100);
    expect(nubank?.values[june]).toBe(200);
  });

  it("quebra o mês por cartão e lista os maiores lançamentos", () => {
    expect(vm.cardTotals).toEqual([
      { cardId: "cc-1", name: "Nubank", total: 200 },
      { cardId: "cc-2", name: "Inter", total: 50 },
    ]);
    expect(vm.topTransactions.map((t) => t.id)).toEqual(["a", "b"]);
  });

  it("resolve nomes de categoria e cartão para a tabela de maiores lançamentos", () => {
    expect(vm.topRows[0]).toMatchObject({
      id: "a",
      categoryName: "Alimentação",
      categoryColor: "#11A36B",
      cardName: "Nubank",
    });
    expect(vm.topRows[1]).toMatchObject({
      id: "b",
      categoryName: "Transporte",
      cardName: "Inter",
    });
  });
});

describe("buildAnalytics — cartão único usa utilização oficial", () => {
  const utilization: CreditCardUtilizationRecord = {
    cycle: {
      startDate: "2026-05-04",
      endDate: "2026-06-03",
      dueDate: "2026-06-10",
      status: "open",
    },
    committedAmount: 200,
    availableAmount: 4800,
    limitAmount: 5000,
    utilizationPct: 73,
  };

  const vm = buildAnalytics({
    transactions: TXS,
    tags: TAGS,
    cards: CARDS,
    month: "2026-06",
    cardId: "cc-1",
    utilization,
  });

  it("prefere o percentual de utilização oficial", () => {
    expect(vm.kpis.limitUsedPct).toBe(73);
  });

  it("escopa a série mensal ao cartão selecionado", () => {
    expect(vm.monthlySeries.series).toHaveLength(1);
    expect(vm.monthlySeries.series[0]?.cardId).toBe("cc-1");
  });
});
