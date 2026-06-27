import type { CreditCard } from "@/features/credit-cards/contracts";
import type { EnrichedTransaction } from "@/features/credit-cards/model/card-transactions";
import {
  NO_CATEGORY_LABEL,
  buildMonthlySeriesByCard,
  cardBreakdown,
  filterByBillMonth,
  filterByCard,
  groupByCategory,
  monthVariation,
  sumAmount,
  topTransactions,
} from "@/features/credit-cards/model/credit-card-aggregation";
import type { Tag } from "@/features/tags/contracts";
import { transactionFixture } from "@/features/transactions/mocks";
import { categoryPalette } from "@/shared/theme";

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
  { id: "t-transport", name: "Transporte", color: null, icon: null },
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

describe("sumAmount", () => {
  it("soma os valores das transações", () => {
    expect(sumAmount([etx({ amount: 10 }), etx({ amount: 5.5 })])).toBe(15.5);
  });
});

describe("filterByBillMonth", () => {
  it("mantém apenas o mês de fatura alvo", () => {
    const result = filterByBillMonth(
      [
        etx({ id: "a", billMonth: "2026-06" }),
        etx({ id: "b", billMonth: "2026-07" }),
      ],
      "2026-06",
    );
    expect(result.map((t) => t.id)).toEqual(["a"]);
  });
});

describe("filterByCard", () => {
  it("retorna todas as transações quando cardId é null", () => {
    const txs = [etx({ creditCardId: "cc-1" }), etx({ creditCardId: "cc-2" })];
    expect(filterByCard(txs, null)).toHaveLength(2);
  });

  it("filtra pelo cartão informado", () => {
    const result = filterByCard(
      [
        etx({ id: "a", creditCardId: "cc-1" }),
        etx({ id: "b", creditCardId: "cc-2" }),
      ],
      "cc-2",
    );
    expect(result.map((t) => t.id)).toEqual(["b"]);
  });
});

describe("groupByCategory", () => {
  it("agrupa por tag, ordena por total desc e rotula sem categoria", () => {
    const groups = groupByCategory(
      [
        etx({ tagId: "t-food", amount: 30 }),
        etx({ tagId: "t-transport", amount: 80 }),
        etx({ tagId: null, amount: 10 }),
      ],
      TAGS,
    );

    expect(groups.map((g) => g.total)).toEqual([80, 30, 10]);
    expect(groups[0]?.name).toBe("Transporte");
    expect(groups[2]?.name).toBe(NO_CATEGORY_LABEL);
  });

  it("usa a cor da tag e um fallback estável para tags sem cor", () => {
    const groups = groupByCategory(
      [etx({ tagId: "t-food" }), etx({ tagId: "t-transport" })],
      TAGS,
    );
    const food = groups.find((g) => g.tagId === "t-food");
    const transport = groups.find((g) => g.tagId === "t-transport");
    expect(food?.color).toBe("#11A36B");
    // Transporte tem cor null → fallback estável da paleta compartilhada
    // (resolveCategoryColor por id; cor é um membro da paleta).
    expect(transport?.color).toMatch(/^#/);
    expect(categoryPalette).toContain(transport?.color);
  });
});

describe("cardBreakdown", () => {
  it("totaliza por cartão ordenado desc", () => {
    const result = cardBreakdown(
      [
        etx({ creditCardId: "cc-1", amount: 100 }),
        etx({ creditCardId: "cc-2", amount: 250 }),
        etx({ creditCardId: "cc-1", amount: 50 }),
      ],
      CARDS,
    );
    expect(result).toEqual([
      { cardId: "cc-2", name: "Inter", total: 250 },
      { cardId: "cc-1", name: "Nubank", total: 150 },
    ]);
  });
});

describe("buildMonthlySeriesByCard", () => {
  it("posiciona os valores na célula mês/cartão correta", () => {
    const result = buildMonthlySeriesByCard(
      [
        etx({ creditCardId: "cc-1", billMonth: "2026-05", amount: 100 }),
        etx({ creditCardId: "cc-1", billMonth: "2026-06", amount: 200 }),
        etx({ creditCardId: "cc-2", billMonth: "2026-06", amount: 50 }),
      ],
      CARDS,
      ["2026-05", "2026-06"],
    );

    expect(result.series).toEqual([
      { cardId: "cc-1", name: "Nubank", values: [100, 200] },
      { cardId: "cc-2", name: "Inter", values: [0, 50] },
    ]);
  });
});

describe("topTransactions", () => {
  it("retorna os N maiores por valor", () => {
    const result = topTransactions(
      [
        etx({ id: "a", amount: 10 }),
        etx({ id: "b", amount: 90 }),
        etx({ id: "c", amount: 50 }),
      ],
      2,
    );
    expect(result.map((t) => t.id)).toEqual(["b", "c"]);
  });
});

describe("monthVariation", () => {
  it("calcula delta e percentual", () => {
    expect(monthVariation(150, 100)).toEqual({ delta: 50, pct: 50 });
  });

  it("retorna percentual null quando o mês anterior é zero", () => {
    expect(monthVariation(150, 0)).toEqual({ delta: 150, pct: null });
  });
});
