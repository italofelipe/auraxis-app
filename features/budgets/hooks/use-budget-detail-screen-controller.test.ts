import { renderHook } from "@testing-library/react-native";

import { useTransactionsQuery } from "@/features/transactions/hooks/use-transactions-query";
import { useBudgetsQuery } from "@/features/budgets/hooks/use-budgets-query";
import { useBudgetDetailScreenController } from "@/features/budgets/hooks/use-budget-detail-screen-controller";

const mockBack = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ back: mockBack }),
  useLocalSearchParams: () => ({ id: "b-1" }),
}));

jest.mock("@/features/budgets/hooks/use-budgets-query", () => ({
  useBudgetsQuery: jest.fn(),
}));
jest.mock("@/features/transactions/hooks/use-transactions-query", () => ({
  useTransactionsQuery: jest.fn(),
}));

const mockedUseBudgets = jest.mocked(useBudgetsQuery);
const mockedUseTransactions = jest.mocked(useTransactionsQuery);

const buildBudget = (overrides: Record<string, unknown> = {}) => ({
  id: "b-1",
  name: "Mercado",
  amount: "1000.00",
  spent: "850.00",
  remaining: "150.00",
  percentageUsed: 85,
  period: "monthly",
  startDate: null,
  endDate: null,
  tagId: "tag-1",
  tagName: "Alimentacao",
  tagColor: "#fff",
  isActive: true,
  isOverBudget: false,
  createdAt: "2026-06-01T00:00:00Z",
  updatedAt: "2026-06-01T00:00:00Z",
  ...overrides,
});

beforeAll(() => {
  jest.useFakeTimers({ doNotFake: ["queueMicrotask"] });
  jest.setSystemTime(new Date("2026-06-11T12:00:00"));
});
afterAll(() => jest.useRealTimers());

beforeEach(() => {
  jest.useFakeTimers({ doNotFake: ["queueMicrotask"] });
  jest.setSystemTime(new Date("2026-06-11T12:00:00"));
  jest.clearAllMocks();
  mockedUseBudgets.mockReturnValue({ data: [buildBudget()] } as never);
  mockedUseTransactions.mockReturnValue({
    data: { transactions: [], pagination: { total: 0 } },
  } as never);
});

describe("useBudgetDetailScreenController", () => {
  it("encontra o orcamento e classifica o nivel de uso", () => {
    const { result } = renderHook(() =>
      useBudgetDetailScreenController({ budgetId: "b-1" }),
    );
    expect(result.current.budget?.id).toBe("b-1");
    expect(result.current.usageLevel).toBe("warning");
    expect(result.current.notFound).toBe(false);
  });

  it("consulta transacoes do periodo filtrando por tag e mes corrente", () => {
    renderHook(() => useBudgetDetailScreenController({ budgetId: "b-1" }));
    expect(mockedUseTransactions).toHaveBeenLastCalledWith({
      startDate: "2026-06-01",
      endDate: "2026-06-30",
      tagId: "tag-1",
      perPage: 5,
    });
  });

  it("usa as datas custom quando o orcamento tem inicio e fim", () => {
    mockedUseBudgets.mockReturnValue({
      data: [
        buildBudget({ period: "custom", startDate: "2026-05-10", endDate: "2026-05-20" }),
      ],
    } as never);
    renderHook(() => useBudgetDetailScreenController({ budgetId: "b-1" }));
    expect(mockedUseTransactions).toHaveBeenLastCalledWith(
      expect.objectContaining({ startDate: "2026-05-10", endDate: "2026-05-20" }),
    );
  });

  it("expoe ate 5 transacoes de preview", () => {
    mockedUseTransactions.mockReturnValue({
      data: {
        transactions: Array.from({ length: 8 }, (_, i) => ({ id: `t-${i}` })),
        pagination: { total: 8 },
      },
    } as never);
    const { result } = renderHook(() =>
      useBudgetDetailScreenController({ budgetId: "b-1" }),
    );
    expect(result.current.previewTransactions).toHaveLength(5);
  });

  it("marca notFound quando o orcamento nao existe na lista", () => {
    const { result } = renderHook(() =>
      useBudgetDetailScreenController({ budgetId: "missing" }),
    );
    expect(result.current.budget).toBeNull();
    expect(result.current.notFound).toBe(true);
  });

  it("handleBack volta para a lista", () => {
    const { result } = renderHook(() =>
      useBudgetDetailScreenController({ budgetId: "b-1" }),
    );
    result.current.handleBack();
    expect(mockBack).toHaveBeenCalled();
  });
});
