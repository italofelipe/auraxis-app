import { act, renderHook } from "@testing-library/react-native";

import type {
  CreditCard,
  CreditCardBillRecord,
  CreditCardUtilizationRecord,
} from "@/features/credit-cards/contracts";
import { useCreditCardBillQuery } from "@/features/credit-cards/hooks/use-credit-card-bill-query";
import { useCreditCardUtilizationQuery } from "@/features/credit-cards/hooks/use-credit-card-utilization-query";
import { useCreditCardsQuery } from "@/features/credit-cards/hooks/use-credit-cards-query";
import {
  CARDS_HOME_TRANSACTION_PAGE_SIZE,
  CARDS_HOME_WINDOW_MONTHS,
  useCardsHomeController,
} from "@/features/credit-cards/hooks/use-cards-home-controller";
import { useTagsQuery } from "@/features/tags/hooks/use-tags-query";
import type { TransactionRecord } from "@/features/transactions/contracts";
import { useTransactionsQuery } from "@/features/transactions/hooks/use-transactions-query";

jest.mock("@/features/credit-cards/hooks/use-credit-cards-query", () => ({
  useCreditCardsQuery: jest.fn(),
}));
jest.mock("@/features/credit-cards/hooks/use-credit-card-bill-query", () => ({
  useCreditCardBillQuery: jest.fn(),
}));
jest.mock("@/features/credit-cards/hooks/use-credit-card-utilization-query", () => ({
  useCreditCardUtilizationQuery: jest.fn(),
}));
jest.mock("@/features/tags/hooks/use-tags-query", () => ({
  useTagsQuery: jest.fn(),
}));
jest.mock("@/features/transactions/hooks/use-transactions-query", () => ({
  useTransactionsQuery: jest.fn(),
}));

const mockedUseCardsQuery = jest.mocked(useCreditCardsQuery);
const mockedUseBillQuery = jest.mocked(useCreditCardBillQuery);
const mockedUseUtilizationQuery = jest.mocked(useCreditCardUtilizationQuery);
const mockedUseTagsQuery = jest.mocked(useTagsQuery);
const mockedUseTransactionsQuery = jest.mocked(useTransactionsQuery);

const buildCard = (override: Partial<CreditCard> = {}): CreditCard => ({
  id: "card-1",
  name: "Nubank",
  brand: "mastercard",
  limitAmount: 5000,
  closingDay: 10,
  dueDay: 20,
  lastFourDigits: "1234",
  bank: "Nubank",
  description: null,
  benefits: [],
  validityDate: null,
  createdAt: null,
  updatedAt: null,
  ...override,
});

const buildTransaction = (
  override: Partial<TransactionRecord> = {},
): TransactionRecord => ({
  id: "tx-1",
  title: "Mercado",
  amount: "100.00",
  type: "expense",
  dueDate: "2026-06-05",
  startDate: null,
  endDate: null,
  description: null,
  observation: null,
  isRecurring: false,
  isInstallment: false,
  installmentCount: null,
  recurrenceInterval: 1,
  recurrenceUnit: "month",
  tagId: "tag-1",
  accountId: null,
  creditCardId: "card-1",
  status: "paid",
  currency: "BRL",
  source: "manual",
  externalId: null,
  bankName: null,
  installmentGroupId: null,
  paidAt: null,
  createdAt: null,
  updatedAt: null,
  ...override,
});

const buildBill = (
  override: Partial<CreditCardBillRecord> = {},
): CreditCardBillRecord => ({
  cycle: {
    startDate: "2026-05-11",
    endDate: "2026-06-10",
    dueDate: "2026-06-20",
    status: "open",
  },
  transactions: [
    {
      id: "bill-tx-1",
      title: "Oficial",
      amount: 999,
      dueDate: "2026-06-05",
      status: "pending",
      type: "expense",
    },
  ],
  totalAmount: 999,
  paidAmount: 0,
  pendingAmount: 999,
  ...override,
});

const buildUtilization = (
  override: Partial<CreditCardUtilizationRecord> = {},
): CreditCardUtilizationRecord => ({
  cycle: {
    startDate: "2026-05-11",
    endDate: "2026-06-10",
    dueDate: "2026-06-20",
    status: "open",
  },
  committedAmount: 2500,
  availableAmount: 2500,
  limitAmount: 5000,
  utilizationPct: 50,
  ...override,
});

const setTransactions = (transactions: readonly TransactionRecord[]): void => {
  mockedUseTransactionsQuery.mockReturnValue({
    data: { transactions, pagination: { total: transactions.length } },
    isLoading: false,
    isError: false,
  } as never);
};

beforeAll(() => {
  jest.useFakeTimers({ doNotFake: ["queueMicrotask"] });
  jest.setSystemTime(new Date("2026-06-15T12:00:00"));
});
afterAll(() => jest.useRealTimers());

beforeEach(() => {
  jest.clearAllMocks();
  mockedUseCardsQuery.mockReturnValue({
    data: { creditCards: [buildCard(), buildCard({ id: "card-2", name: "Inter" })] },
    isLoading: false,
    isError: false,
  } as never);
  mockedUseTagsQuery.mockReturnValue({
    data: { tags: [{ id: "tag-1", name: "Alimentação", color: "#ff0000", icon: null }] },
    isLoading: false,
    isError: false,
  } as never);
  mockedUseBillQuery.mockReturnValue({
    data: buildBill(),
    isLoading: false,
    isError: false,
  } as never);
  mockedUseUtilizationQuery.mockReturnValue({
    data: buildUtilization(),
    isLoading: false,
    isError: false,
  } as never);
  setTransactions([
    buildTransaction(),
    buildTransaction({ id: "tx-2", amount: "50.00", creditCardId: "card-2", tagId: null }),
  ]);
});

describe("useCardsHomeController — estado inicial", () => {
  it("inicia em Faturas, todos os cartões e mês de fatura atual", () => {
    const { result } = renderHook(() => useCardsHomeController());

    expect(result.current.view).toBe("faturas");
    expect(result.current.selectedCardId).toBeNull();
    expect(result.current.selectedMonth).toBe("2026-06");
  });

  it("expõe os objetos de query para estados de loading/erro", () => {
    const { result } = renderHook(() => useCardsHomeController());

    expect(result.current.cardsQuery).toBeDefined();
    expect(result.current.tagsQuery).toBeDefined();
    expect(result.current.transactionsQuery).toBeDefined();
    expect(result.current.utilizationQuery).toBeDefined();
    expect(result.current.billQuery).toBeDefined();
  });

  it("consulta transações de despesa na janela de ~6 meses com página ampla", () => {
    renderHook(() => useCardsHomeController());

    expect(mockedUseTransactionsQuery).toHaveBeenLastCalledWith({
      type: "expense",
      startDate: "2025-12-01",
      endDate: "2026-06-30",
      perPage: CARDS_HOME_TRANSACTION_PAGE_SIZE,
    });
  });

  it("monta a lista de chips com a janela de meses e marca o mês atual", () => {
    const { result } = renderHook(() => useCardsHomeController());

    expect(result.current.months).toHaveLength(CARDS_HOME_WINDOW_MONTHS);
    const current = result.current.months.find((month) => month.isCurrent);
    expect(current?.month).toBe("2026-06");
    expect(current?.shortLabel).toBe("Jun");
    expect(current?.label).toBe("junho de 2026");
    expect(result.current.months.at(-1)?.month).toBe("2026-06");
  });
});

describe("useCardsHomeController — troca de view", () => {
  it("alterna entre Faturas e Analítico", () => {
    const { result } = renderHook(() => useCardsHomeController());

    act(() => result.current.setView("analitico"));
    expect(result.current.view).toBe("analitico");

    act(() => result.current.setView("faturas"));
    expect(result.current.view).toBe("faturas");
  });
});

describe("useCardsHomeController — view-model consolidado (todos)", () => {
  it("Faturas soma todos os cartões e ignora a fatura oficial", () => {
    const { result } = renderHook(() => useCardsHomeController());

    // 100 (card-1) + 50 (card-2) = 150, não usa o totalAmount oficial (999).
    expect(result.current.faturas.total).toBe(150);
    expect(result.current.faturas.cardId).toBeNull();
    expect(result.current.faturas.itemCount).toBe(2);
    expect(result.current.faturas.railTotals).toHaveLength(2);
    expect(result.current.faturas.allCardsTotal).toBe(150);
  });

  it("Analítico agrega KPIs de todos os cartões na janela de 6 meses", () => {
    const { result } = renderHook(() => useCardsHomeController());

    expect(result.current.analitico.kpis.billTotal).toBe(150);
    expect(result.current.analitico.cardId).toBeNull();
    expect(result.current.analitico.monthlySeries.months).toHaveLength(
      CARDS_HOME_WINDOW_MONTHS,
    );
    // Uma série por cartão (consolidado abrange todos).
    expect(result.current.analitico.monthlySeries.series).toHaveLength(2);
    expect(result.current.analitico.topRows.length).toBeGreaterThan(0);
  });

  it("não habilita as queries de cartão único quando todos estão selecionados", () => {
    renderHook(() => useCardsHomeController());

    expect(mockedUseUtilizationQuery).toHaveBeenLastCalledWith(
      "",
      expect.objectContaining({ enabled: false }),
    );
    expect(mockedUseBillQuery).toHaveBeenLastCalledWith(
      "",
      "2026-06",
      expect.objectContaining({ enabled: false }),
    );
  });
});

describe("useCardsHomeController — seleção de cartão", () => {
  it("selecionar cartão filtra os view-models e habilita as queries oficiais", () => {
    const { result } = renderHook(() => useCardsHomeController());

    act(() => result.current.selectCard("card-1"));

    expect(result.current.selectedCardId).toBe("card-1");
    // Apenas card-1 (100), card-2 (50) sai do escopo.
    expect(result.current.analitico.kpis.billTotal).toBe(100);
    expect(result.current.analitico.monthlySeries.series).toHaveLength(1);
    expect(mockedUseUtilizationQuery).toHaveBeenLastCalledWith(
      "card-1",
      expect.objectContaining({ enabled: true }),
    );
    expect(mockedUseBillQuery).toHaveBeenLastCalledWith(
      "card-1",
      "2026-06",
      expect.objectContaining({ enabled: true }),
    );
  });

  it("Faturas usa os números oficiais da fatura para um cartão único", () => {
    const { result } = renderHook(() => useCardsHomeController());

    act(() => result.current.selectCard("card-1"));

    // Com bill oficial, total = totalAmount (999) e itemCount = bill.transactions.length.
    expect(result.current.faturas.total).toBe(999);
    expect(result.current.faturas.itemCount).toBe(1);
    expect(result.current.faturas.cardId).toBe("card-1");
    expect(result.current.faturas.utilizationPct).toBe(50);
    expect(result.current.faturas.status?.tone).toBe("open");
  });

  it("selectCard(null) volta para o consolidado", () => {
    const { result } = renderHook(() => useCardsHomeController());

    act(() => result.current.selectCard("card-1"));
    act(() => result.current.selectCard(null));

    expect(result.current.selectedCardId).toBeNull();
    expect(result.current.faturas.total).toBe(150);
  });
});

describe("useCardsHomeController — navegação de mês", () => {
  it("selectMonth muda o mês e refaz a janela de transações", () => {
    const { result } = renderHook(() => useCardsHomeController());

    act(() => result.current.selectMonth("2026-04"));

    expect(result.current.selectedMonth).toBe("2026-04");
    expect(mockedUseTransactionsQuery).toHaveBeenLastCalledWith({
      type: "expense",
      startDate: "2025-10-01",
      endDate: "2026-04-30",
      perPage: CARDS_HOME_TRANSACTION_PAGE_SIZE,
    });
  });

  it("goPreviousMonth e goNextMonth deslocam o mês em ±1", () => {
    const { result } = renderHook(() => useCardsHomeController());

    act(() => result.current.goPreviousMonth());
    expect(result.current.selectedMonth).toBe("2026-05");

    act(() => result.current.goNextMonth());
    expect(result.current.selectedMonth).toBe("2026-06");
  });

  it("trocar o mês altera as derivações (mês sem gastos zera o total)", () => {
    const { result } = renderHook(() => useCardsHomeController());

    // tx caem na fatura de junho; abril não tem lançamentos no escopo.
    act(() => result.current.selectMonth("2026-04"));

    expect(result.current.faturas.total).toBe(0);
    expect(result.current.analitico.kpis.billTotal).toBe(0);
  });
});

describe("useCardsHomeController — dados vazios", () => {
  it("não quebra quando todas as queries estão sem dados", () => {
    mockedUseCardsQuery.mockReturnValue({ data: undefined } as never);
    mockedUseTagsQuery.mockReturnValue({ data: undefined } as never);
    mockedUseBillQuery.mockReturnValue({ data: undefined } as never);
    mockedUseUtilizationQuery.mockReturnValue({ data: undefined } as never);
    mockedUseTransactionsQuery.mockReturnValue({ data: undefined } as never);

    const { result } = renderHook(() => useCardsHomeController());

    expect(result.current.faturas.total).toBe(0);
    expect(result.current.faturas.categories).toEqual([]);
    expect(result.current.analitico.kpis.billTotal).toBe(0);
    expect(result.current.analitico.topRows).toEqual([]);
    expect(result.current.months).toHaveLength(CARDS_HOME_WINDOW_MONTHS);
  });
});
