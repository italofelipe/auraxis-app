import type {
  TransactionRecord,
  TransactionStatus,
} from "@/features/transactions/contracts";
import {
  computeFeedKpis,
  groupExpensesByCategory,
  percentOfTotal,
  relativeDateLabel,
  shortDateLabel,
  toFeedItem,
  type FeedKpis,
} from "@/features/transactions/model/transactions-feed";
import type { Tag } from "@/features/tags/contracts";
import { NO_CATEGORY_COLOR, resolveCategoryColor } from "@/shared/theme";

/**
 * Monta um TransactionRecord completo com defaults para os testes.
 *
 * @param partial Campos a sobrescrever.
 * @returns TransactionRecord completo.
 */
const tx = (partial: Partial<TransactionRecord> = {}): TransactionRecord => ({
  id: "tx-1",
  title: "Mercado",
  amount: "100.00",
  type: "expense",
  dueDate: "2026-06-20",
  startDate: null,
  endDate: null,
  description: null,
  observation: null,
  isRecurring: false,
  isInstallment: false,
  installmentCount: null,
  recurrenceInterval: 1,
  recurrenceUnit: "month",
  tagId: null,
  accountId: null,
  creditCardId: null,
  status: "pending",
  currency: "BRL",
  source: "manual",
  externalId: null,
  bankName: null,
  installmentGroupId: null,
  paidAt: null,
  createdAt: null,
  updatedAt: null,
  ...partial,
});

const tag = (partial: Partial<Tag> = {}): Tag => ({
  id: "tag-1",
  name: "Alimentação",
  color: "#11A36B",
  icon: "cart",
  ...partial,
});

describe("relativeDateLabel", () => {
  const today = "2026-06-20";

  it("retorna 'Hoje' quando é o mesmo dia", () => {
    expect(relativeDateLabel("2026-06-20", today)).toBe("Hoje");
  });

  it("retorna 'Ontem' para -1 dia", () => {
    expect(relativeDateLabel("2026-06-19", today)).toBe("Ontem");
  });

  it("retorna 'Amanhã' para +1 dia", () => {
    expect(relativeDateLabel("2026-06-21", today)).toBe("Amanhã");
  });

  it("retorna 'em N dias' para futuro próximo (2..14)", () => {
    expect(relativeDateLabel("2026-06-22", today)).toBe("em 2 dias");
    expect(relativeDateLabel("2026-07-04", today)).toBe("em 14 dias");
  });

  it("retorna 'há N dias' para passado recente (2..14)", () => {
    expect(relativeDateLabel("2026-06-18", today)).toBe("há 2 dias");
    expect(relativeDateLabel("2026-06-06", today)).toBe("há 14 dias");
  });

  it("retorna null fora da janela de ±14 dias", () => {
    expect(relativeDateLabel("2026-07-05", today)).toBeNull();
    expect(relativeDateLabel("2026-06-05", today)).toBeNull();
  });

  it("faz parsing date-only timezone-safe (sem componente de horário)", () => {
    // Mesmo com horários diferentes embutidos, a comparação é só por data.
    expect(relativeDateLabel("2026-06-20T23:59:59Z", "2026-06-20T00:00:00Z")).toBe(
      "Hoje",
    );
  });

  it("atravessa virada de mês corretamente", () => {
    expect(relativeDateLabel("2026-07-01", "2026-06-30")).toBe("Amanhã");
    expect(relativeDateLabel("2026-05-31", "2026-06-01")).toBe("Ontem");
  });

  it("não quebra com strings de data vazias/malformadas (fallback defensivo)", () => {
    // Ambas caem no epoch local 1970-01-01 → mesmo dia → "Hoje".
    expect(relativeDateLabel("", "")).toBe("Hoje");
  });
});

describe("computeFeedKpis", () => {
  it("soma receitas e despesas a partir do amount string", () => {
    const kpis = computeFeedKpis([
      tx({ type: "income", amount: "8200.00" }),
      tx({ type: "expense", amount: "2300.00" }),
      tx({ type: "expense", amount: "200.50" }),
    ]);
    expect(kpis.income).toBeCloseTo(8200);
    expect(kpis.expense).toBeCloseTo(2500.5);
    expect(kpis.result).toBeCloseTo(5699.5);
    expect(kpis.count).toBe(3);
  });

  it("exclui transações canceladas", () => {
    const kpis = computeFeedKpis([
      tx({ type: "income", amount: "100.00" }),
      tx({ type: "expense", amount: "50.00", status: "cancelled" }),
    ]);
    expect(kpis.income).toBeCloseTo(100);
    expect(kpis.expense).toBe(0);
    expect(kpis.count).toBe(1);
  });

  it("ignora amounts não numéricos", () => {
    const kpis = computeFeedKpis([
      tx({ type: "income", amount: "abc" }),
      tx({ type: "income", amount: "10.00" }),
    ]);
    expect(kpis.income).toBeCloseTo(10);
    expect(kpis.count).toBe(2);
  });

  it("filtra por whitelist de status quando informada", () => {
    const statuses: readonly TransactionStatus[] = ["paid"];
    const kpis = computeFeedKpis(
      [
        tx({ type: "expense", amount: "30.00", status: "paid" }),
        tx({ type: "expense", amount: "70.00", status: "pending" }),
      ],
      statuses,
    );
    expect(kpis.expense).toBeCloseTo(30);
    expect(kpis.count).toBe(1);
  });

  it("retorna zeros para lista vazia", () => {
    const kpis = computeFeedKpis([]);
    expect(kpis).toEqual({ income: 0, expense: 0, result: 0, count: 0 });
  });
});

describe("groupExpensesByCategory", () => {
  it("agrupa apenas despesas por categoria, ordenado por total desc", () => {
    const tags = [tag(), tag({ id: "tag-2", name: "Transporte", color: "#2E7CF6" })];
    const bars = groupExpensesByCategory(
      [
        tx({ type: "expense", amount: "100.00", tagId: "tag-1" }),
        tx({ type: "expense", amount: "300.00", tagId: "tag-2" }),
        tx({ type: "income", amount: "999.00", tagId: "tag-1" }),
      ],
      tags,
    );
    expect(bars).toHaveLength(2);
    expect(bars[0]).toEqual({
      tagId: "tag-2",
      name: "Transporte",
      color: resolveCategoryColor({ id: "tag-2", color: "#2E7CF6" }),
      total: 300,
    });
    expect(bars[1]?.tagId).toBe("tag-1");
  });

  it("usa 'Sem categoria' e cor neutra quando não há tag", () => {
    const bars = groupExpensesByCategory(
      [tx({ type: "expense", amount: "40.00", tagId: null })],
      [],
    );
    expect(bars[0]).toEqual({
      tagId: null,
      name: "Sem categoria",
      color: NO_CATEGORY_COLOR,
      total: 40,
    });
  });

  it("ignora transações canceladas", () => {
    const bars = groupExpensesByCategory(
      [tx({ type: "expense", amount: "40.00", status: "cancelled", tagId: "tag-1" })],
      [tag()],
    );
    expect(bars).toEqual([]);
  });

  it("cai para 'Sem categoria' quando o tagId não está na lista de tags", () => {
    const bars = groupExpensesByCategory(
      [tx({ type: "expense", amount: "15.00", tagId: "ghost" })],
      [],
    );
    expect(bars[0]?.name).toBe("Sem categoria");
    expect(bars[0]?.tagId).toBe("ghost");
  });
});

describe("percentOfTotal", () => {
  it("retorna percentual inteiro", () => {
    expect(percentOfTotal(25, 100)).toBe(25);
    expect(percentOfTotal(1, 3)).toBe(33);
  });

  it("retorna 0 quando o total é zero", () => {
    expect(percentOfTotal(50, 0)).toBe(0);
  });
});

describe("toFeedItem", () => {
  const today = "2026-06-20";
  const kpis: FeedKpis = { income: 1000, expense: 400, result: 600, count: 5 };

  it("constrói o view-model com categoria, sinal e percentuais", () => {
    const item = toFeedItem({
      tx: tx({
        id: "tx-9",
        title: "Uber",
        description: "corrida",
        amount: "200.00",
        type: "expense",
        tagId: "tag-1",
        dueDate: "2026-06-20",
        status: "pending",
      }),
      tags: [tag()],
      kpis,
      today,
    });
    expect(item.id).toBe("tx-9");
    expect(item.title).toBe("Uber");
    expect(item.description).toBe("corrida");
    expect(item.amount).toBeCloseTo(200);
    expect(item.type).toBe("expense");
    expect(item.status).toBe("pending");
    expect(item.categoryName).toBe("Alimentação");
    expect(item.categoryColor).toBe(resolveCategoryColor({ id: "tag-1", color: "#11A36B" }));
    expect(item.categoryIcon).toBe("cart");
    expect(item.relativeDate).toBe("Hoje");
    expect(item.signedDisplay.startsWith("−")).toBe(true);
    // 200 / 400 (despesa) = 50%
    expect(item.percentOfFlow).toBe(50);
  });

  it("usa o fluxo de receita para transações de entrada e sinal positivo", () => {
    const item = toFeedItem({
      tx: tx({ type: "income", amount: "250.00", tagId: null }),
      tags: [],
      kpis,
      today,
    });
    expect(item.signedDisplay.startsWith("+")).toBe(true);
    expect(item.categoryName).toBe("Sem categoria");
    expect(item.categoryColor).toBe(NO_CATEGORY_COLOR);
    expect(item.categoryIcon).toBeNull();
    // 250 / 1000 (receita) = 25%
    expect(item.percentOfFlow).toBe(25);
  });

  it("retorna 0% de fluxo quando o denominador é zero", () => {
    const item = toFeedItem({
      tx: tx({ type: "expense", amount: "10.00" }),
      tags: [],
      kpis: { income: 0, expense: 0, result: 0, count: 0 },
      today,
    });
    expect(item.percentOfFlow).toBe(0);
  });

  it("expõe flags de recorrência e parcelamento e relativeDate null fora da janela", () => {
    const item = toFeedItem({
      tx: tx({
        isRecurring: true,
        isInstallment: true,
        installmentCount: 12,
        dueDate: "2026-12-25",
      }),
      tags: [],
      kpis,
      today,
    });
    expect(item.isRecurring).toBe(true);
    expect(item.isInstallment).toBe(true);
    expect(item.relativeDate).toBeNull();
    // Fora da janela relativa, o display cai para "DD mmm".
    expect(item.dateDisplay).toBe("25 dez");
  });

  it("usa o rótulo relativo no dateDisplay quando está na janela", () => {
    const item = toFeedItem({
      tx: tx({ dueDate: "2026-06-20" }),
      tags: [],
      kpis,
      today,
    });
    expect(item.dateDisplay).toBe("Hoje");
  });

  it("marca o selo de fatura quando o lançamento de cartão veio de outro mês", () => {
    const item = toFeedItem({
      tx: tx({ creditCardId: "cc-1", dueDate: "2026-06-19" }),
      tags: [],
      kpis,
      today,
      selectedMonth: { year: 2026, month: 6 },
    });
    expect(item.invoiceBadgeMonth).toBe("jul/26");
  });

  it("não marca o selo quando o mês do dueDate coincide com o selecionado", () => {
    const item = toFeedItem({
      tx: tx({ creditCardId: "cc-1", dueDate: "2026-07-10" }),
      tags: [],
      kpis,
      today,
      selectedMonth: { year: 2026, month: 6 },
    });
    expect(item.invoiceBadgeMonth).toBeNull();
  });

  it("não marca o selo para lançamento sem cartão", () => {
    const item = toFeedItem({
      tx: tx({ creditCardId: null, dueDate: "2026-06-19" }),
      tags: [],
      kpis,
      today,
      selectedMonth: { year: 2026, month: 6 },
    });
    expect(item.invoiceBadgeMonth).toBeNull();
  });

  it("não marca o selo quando não há mês selecionado (sem range/mês de referência)", () => {
    const item = toFeedItem({
      tx: tx({ creditCardId: "cc-1", dueDate: "2026-06-19" }),
      tags: [],
      kpis,
      today,
    });
    expect(item.invoiceBadgeMonth).toBeNull();
  });
});

describe("shortDateLabel", () => {
  it("formata 'DD mmm' em pt-BR (date-only)", () => {
    expect(shortDateLabel("2026-06-20")).toBe("20 jun");
    expect(shortDateLabel("2026-01-05")).toBe("5 jan");
    expect(shortDateLabel("2026-12-31")).toBe("31 dez");
  });
});
