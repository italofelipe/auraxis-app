import { act, renderHook } from "@testing-library/react-native";

import type { TransactionRecord } from "@/features/transactions/contracts";
import { useTransactionsFeedController } from "@/features/transactions/hooks/use-transactions-feed-controller";
import {
  useCreateTransactionMutation,
  useDeleteTransactionMutation,
  useMarkTransactionPaidMutation,
  useUpdateTransactionMutation,
} from "@/features/transactions/hooks/use-transaction-mutations";
import { useTransactionsQuery } from "@/features/transactions/hooks/use-transactions-query";
import { useTagsQuery } from "@/features/tags/hooks/use-tags-query";

jest.mock("@/features/transactions/hooks/use-transactions-query", () => ({
  useTransactionsQuery: jest.fn(),
}));
jest.mock("@/features/transactions/hooks/use-transaction-mutations", () => ({
  useCreateTransactionMutation: jest.fn(),
  useUpdateTransactionMutation: jest.fn(),
  useDeleteTransactionMutation: jest.fn(),
  useMarkTransactionPaidMutation: jest.fn(),
}));
jest.mock("@/features/tags/hooks/use-tags-query", () => ({
  useTagsQuery: jest.fn(),
}));

const mockedUseQuery = jest.mocked(useTransactionsQuery);
const mockedUseTagsQuery = jest.mocked(useTagsQuery);
const mockedUseCreate = jest.mocked(useCreateTransactionMutation);
const mockedUseUpdate = jest.mocked(useUpdateTransactionMutation);
const mockedUseDelete = jest.mocked(useDeleteTransactionMutation);
const mockedUseMarkPaid = jest.mocked(useMarkTransactionPaidMutation);

const buildMutationStub = () => ({
  mutateAsync: jest.fn().mockResolvedValue(undefined),
  reset: jest.fn(),
  isPending: false,
  error: null,
});

const buildRecord = (
  override: Partial<TransactionRecord> = {},
): TransactionRecord => ({
  id: "tx-1",
  title: "Salário",
  amount: "8200.00",
  type: "income",
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
  ...override,
});

const setQuery = (transactions: readonly TransactionRecord[]): void => {
  mockedUseQuery.mockReturnValue({
    data: {
      transactions,
      pagination: { total: transactions.length, page: 1, perPage: 50 },
    },
  } as never);
};

beforeAll(() => {
  jest.useFakeTimers({ doNotFake: ["queueMicrotask"] });
  jest.setSystemTime(new Date("2026-06-20T12:00:00"));
});
afterAll(() => jest.useRealTimers());

beforeEach(() => {
  jest.clearAllMocks();
  mockedUseCreate.mockReturnValue(buildMutationStub() as never);
  mockedUseUpdate.mockReturnValue(buildMutationStub() as never);
  mockedUseDelete.mockReturnValue(buildMutationStub() as never);
  mockedUseMarkPaid.mockReturnValue(buildMutationStub() as never);
  mockedUseTagsQuery.mockReturnValue({
    data: {
      tags: [{ id: "tag-1", name: "Alimentação", color: "#11A36B", icon: "cart" }],
    },
  } as never);
  // Datas derivadas do MESMO relógio fake via getters locais (igual ao
  // todayIso do controller), para o rótulo relativo ser estável em qualquer
  // timezone (o CI roda em UTC, o dev pode estar em UTC-3).
  const now = new Date();
  const pad = (value: number): string => `${value}`.padStart(2, "0");
  const localDate = (date: Date): string =>
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  setQuery([
    buildRecord({ dueDate: localDate(now) }),
    buildRecord({
      id: "tx-2",
      title: "Mercado",
      type: "expense",
      amount: "300.00",
      tagId: "tag-1",
      dueDate: localDate(
        new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1),
      ),
    }),
  ]);
});

describe("useTransactionsFeedController — modo de visualização", () => {
  it("inicia no modo 'facil'", () => {
    const { result } = renderHook(() => useTransactionsFeedController());
    expect(result.current.viewMode).toBe("facil");
  });

  it("alterna para 'analitico' via setViewMode", () => {
    const { result } = renderHook(() => useTransactionsFeedController());
    act(() => result.current.setViewMode("analitico"));
    expect(result.current.viewMode).toBe("analitico");
  });

  it("inicia com o calendário inativo e alterna via toggleCalendar", () => {
    const { result } = renderHook(() => useTransactionsFeedController());
    expect(result.current.calendarActive).toBe(false);
    act(() => result.current.toggleCalendar());
    expect(result.current.calendarActive).toBe(true);
    act(() => result.current.toggleCalendar());
    expect(result.current.calendarActive).toBe(false);
  });
});

describe("useTransactionsFeedController — view-models derivados", () => {
  it("expõe heroKpis calculados a partir dos registros crus", () => {
    const { result } = renderHook(() => useTransactionsFeedController());
    expect(result.current.heroKpis.income).toBeCloseTo(8200);
    expect(result.current.heroKpis.expense).toBeCloseTo(300);
    expect(result.current.heroKpis.result).toBeCloseTo(7900);
    expect(result.current.heroKpis.count).toBe(2);
  });

  it("expõe categoryBars apenas com despesas", () => {
    const { result } = renderHook(() => useTransactionsFeedController());
    expect(result.current.categoryBars).toHaveLength(1);
    expect(result.current.categoryBars[0]?.name).toBe("Alimentação");
    expect(result.current.categoryBars[0]?.total).toBeCloseTo(300);
  });

  it("expõe feedItems com rótulo relativo e sinal", () => {
    const { result } = renderHook(() => useTransactionsFeedController());
    const items = result.current.feedItems;
    expect(items).toHaveLength(2);
    const income = items.find((item) => item.id === "tx-1");
    const expense = items.find((item) => item.id === "tx-2");
    expect(income?.relativeDate).toBe("Hoje");
    expect(income?.signedDisplay.startsWith("+")).toBe(true);
    expect(expense?.relativeDate).toBe("Ontem");
    expect(expense?.signedDisplay.startsWith("−")).toBe(true);
    expect(expense?.categoryName).toBe("Alimentação");
  });

  it("preserva a interface do controller existente (passthrough)", () => {
    const { result } = renderHook(() => useTransactionsFeedController());
    expect(typeof result.current.goToPreviousMonth).toBe("function");
    expect(typeof result.current.setTypeFilter).toBe("function");
    expect(result.current.total).toBe(2);
    // monthBalance vem do controller base e bate com o resultado dos KPIs.
    expect(result.current.monthBalance).toBeCloseTo(result.current.heroKpis.result);
  });

  it("lida com ausência de dados retornando coleções vazias e KPIs zerados", () => {
    mockedUseQuery.mockReturnValue({ data: undefined } as never);
    mockedUseTagsQuery.mockReturnValue({ data: undefined } as never);
    const { result } = renderHook(() => useTransactionsFeedController());
    expect(result.current.feedItems).toEqual([]);
    expect(result.current.categoryBars).toEqual([]);
    expect(result.current.heroKpis).toEqual({
      income: 0,
      expense: 0,
      result: 0,
      count: 0,
    });
  });
});
