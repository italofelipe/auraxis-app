import { renderHook } from "@testing-library/react-native";

import type {
  CreditCard,
  CreditCardUtilizationRecord,
} from "@/features/credit-cards/contracts";
import { useCreditCardsQuery } from "@/features/credit-cards/hooks/use-credit-cards-query";
import { useCreditCardUtilizationQuery } from "@/features/credit-cards/hooks/use-credit-card-utilization-query";
import {
  CREDIT_CARD_DETAIL_WINDOW_MONTHS,
  useCreditCardDetailScreenController,
} from "@/features/credit-cards/hooks/use-credit-card-detail-screen-controller";
import { useTagsQuery } from "@/features/tags/hooks/use-tags-query";
import type { TransactionRecord } from "@/features/transactions/contracts";
import { useTransactionsQuery } from "@/features/transactions/hooks/use-transactions-query";
import { resolveCardGradient } from "@/shared/theme";

const mockBack = jest.fn();
const mockPush = jest.fn();
const mockOpenExpenseSheet = jest.fn();
let mockRouteParams: { id?: string | string[] } = { id: "cc-1" };

jest.mock("expo-router", () => ({
  useRouter: () => ({ back: mockBack, push: mockPush }),
  useLocalSearchParams: () => mockRouteParams,
}));

jest.mock("@/features/credit-cards/hooks/use-credit-cards-query", () => ({
  useCreditCardsQuery: jest.fn(),
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
jest.mock("@/stores/expense-sheet-store", () => ({
  useExpenseSheetStore: (selector: (state: { open: () => void }) => unknown) =>
    selector({ open: mockOpenExpenseSheet }),
}));

const mockedUseCards = jest.mocked(useCreditCardsQuery);
const mockedUseUtilization = jest.mocked(useCreditCardUtilizationQuery);
const mockedUseTags = jest.mocked(useTagsQuery);
const mockedUseTransactions = jest.mocked(useTransactionsQuery);

const buildCard = (overrides: Partial<CreditCard> = {}): CreditCard => ({
  id: "cc-1",
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
  ...overrides,
});

const buildUtilization = (
  overrides: Partial<CreditCardUtilizationRecord> = {},
): CreditCardUtilizationRecord => ({
  cycle: {
    startDate: "2026-06-04",
    endDate: "2026-07-03",
    dueDate: "2026-07-10",
    status: "open",
  },
  committedAmount: 8144.01,
  availableAmount: 16855.99,
  limitAmount: 25000,
  utilizationPct: 33,
  ...overrides,
});

const buildTransaction = (
  overrides: Partial<TransactionRecord> = {},
): TransactionRecord => ({
  id: "tx-1",
  title: "Renner",
  amount: "938.57",
  type: "expense",
  dueDate: "2026-06-25",
  startDate: null,
  endDate: null,
  description: null,
  observation: null,
  isRecurring: false,
  isInstallment: false,
  installmentCount: null,
  recurrenceInterval: 1,
  recurrenceUnit: "month",
  tagId: "tag-compras",
  accountId: null,
  creditCardId: "cc-1",
  status: "paid",
  currency: "BRL",
  source: "manual",
  externalId: null,
  bankName: null,
  installmentGroupId: null,
  paidAt: null,
  createdAt: null,
  updatedAt: null,
  ...overrides,
});

beforeAll(() => {
  jest.useFakeTimers({ doNotFake: ["queueMicrotask"] });
  jest.setSystemTime(new Date("2026-06-20T12:00:00"));
});
afterAll(() => jest.useRealTimers());

beforeEach(() => {
  jest.useFakeTimers({ doNotFake: ["queueMicrotask"] });
  jest.setSystemTime(new Date("2026-06-20T12:00:00"));
  jest.clearAllMocks();
  mockRouteParams = { id: "cc-1" };
  mockedUseCards.mockReturnValue({
    data: { creditCards: [buildCard()] },
    isLoading: false,
  } as never);
  mockedUseUtilization.mockReturnValue({ data: buildUtilization() } as never);
  mockedUseTags.mockReturnValue({
    data: {
      tags: [
        { id: "tag-compras", name: "Compras", color: "#9B5DE5", icon: null },
        { id: "tag-viagem", name: "Viagem", color: "#00BBF9", icon: null },
      ],
    },
  } as never);
  mockedUseTransactions.mockReturnValue({
    data: {
      transactions: [
        buildTransaction(),
        buildTransaction({
          id: "tx-2",
          title: "Apple Store",
          amount: "373.07",
          tagId: "tag-compras",
          dueDate: "2026-06-16",
        }),
        buildTransaction({
          id: "tx-3",
          title: "Latam",
          amount: "1200.00",
          tagId: "tag-viagem",
          dueDate: "2026-06-10",
        }),
      ],
    },
  } as never);
});

describe("useCreditCardDetailScreenController — base", () => {
  it("encontra o cartao e marca ciclo configurado", () => {
    const { result } = renderHook(() =>
      useCreditCardDetailScreenController({ creditCardId: "cc-1" }),
    );
    expect(result.current.creditCard?.id).toBe("cc-1");
    expect(result.current.hasCycleConfig).toBe(true);
    expect(result.current.notFound).toBe(false);
  });

  it("habilita a query de utilizacao apenas com ciclo configurado", () => {
    renderHook(() => useCreditCardDetailScreenController({ creditCardId: "cc-1" }));
    expect(mockedUseUtilization).toHaveBeenCalledWith("cc-1", { enabled: true });
  });

  it("marca ciclo faltante quando closingDay ou dueDay sao nulos", () => {
    mockedUseCards.mockReturnValue({
      data: { creditCards: [buildCard({ closingDay: null })] },
      isLoading: false,
    } as never);
    const { result } = renderHook(() =>
      useCreditCardDetailScreenController({ creditCardId: "cc-1" }),
    );
    expect(result.current.hasCycleConfig).toBe(false);
    expect(mockedUseUtilization).toHaveBeenCalledWith("cc-1", { enabled: false });
  });

  it("marca notFound quando o cartao nao existe", () => {
    const { result } = renderHook(() =>
      useCreditCardDetailScreenController({ creditCardId: "missing" }),
    );
    expect(result.current.creditCard).toBeNull();
    expect(result.current.notFound).toBe(true);
  });

  it("handleViewBill navega para a fatura", () => {
    const { result } = renderHook(() =>
      useCreditCardDetailScreenController({ creditCardId: "cc-1" }),
    );
    result.current.handleViewBill();
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/cartoes/[id]/fatura",
      params: { id: "cc-1" },
    });
  });

  it("handleBack volta para a lista", () => {
    const { result } = renderHook(() =>
      useCreditCardDetailScreenController({ creditCardId: "cc-1" }),
    );
    result.current.handleBack();
    expect(mockBack).toHaveBeenCalled();
  });
});

describe("useCreditCardDetailScreenController — janela de transacoes", () => {
  it("consulta transacoes de despesa do cartao na janela de ~7 meses", () => {
    renderHook(() => useCreditCardDetailScreenController({ creditCardId: "cc-1" }));
    expect(mockedUseTransactions).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "expense",
        creditCardId: "cc-1",
        endDate: "2026-06-30",
      }),
    );
  });
});

describe("useCreditCardDetailScreenController — view-model", () => {
  it("monta o subtitle com emissor e bandeira", () => {
    const { result } = renderHook(() =>
      useCreditCardDetailScreenController({ creditCardId: "cc-1" }),
    );
    expect(result.current.detail?.subtitle).toBe("Inter · mastercard");
  });

  it("usa os numeros oficiais de utilizacao no bloco de limite", () => {
    const { result } = renderHook(() =>
      useCreditCardDetailScreenController({ creditCardId: "cc-1" }),
    );
    const limit = result.current.detail?.limit;
    expect(limit?.usedPct).toBe(33);
    expect(limit?.limitAmount).toBe(25000);
    expect(limit?.availableAmount).toBe(16855.99);
    expect(limit?.currentBillTotal).toBe(8144.01);
    expect(limit?.tone).toBe("primary");
  });

  it("expoe o total da fatura atual (oficial)", () => {
    const { result } = renderHook(() =>
      useCreditCardDetailScreenController({ creditCardId: "cc-1" }),
    );
    expect(result.current.detail?.currentBillTotal).toBe(8144.01);
  });

  it("deriva o bloco de limite quando nao ha utilizacao oficial", () => {
    mockedUseUtilization.mockReturnValue({ data: null } as never);
    const { result } = renderHook(() =>
      useCreditCardDetailScreenController({ creditCardId: "cc-1" }),
    );
    const limit = result.current.detail?.limit;
    // 938.57 + 373.07 + 1200 = 2511.64 caem na fatura de junho (current).
    expect(limit?.currentBillTotal).toBeCloseTo(2511.64, 2);
    expect(limit?.limitAmount).toBe(25000);
    expect(limit?.availableAmount).toBeCloseTo(22488.36, 2);
    expect(limit?.usedPct).toBeCloseTo((2511.64 / 25000) * 100, 2);
  });

  it("monta a serie de evolucao com a janela de meses", () => {
    const { result } = renderHook(() =>
      useCreditCardDetailScreenController({ creditCardId: "cc-1" }),
    );
    expect(result.current.detail?.evolution).toHaveLength(
      CREDIT_CARD_DETAIL_WINDOW_MONTHS,
    );
    // O ultimo ponto e o mes atual e soma os lancamentos de junho.
    expect(result.current.detail?.evolution.at(-1)?.value).toBeCloseTo(
      2511.64,
      2,
    );
  });

  it("agrega as principais categorias do mes (ordenadas por total)", () => {
    const { result } = renderHook(() =>
      useCreditCardDetailScreenController({ creditCardId: "cc-1" }),
    );
    const categories = result.current.detail?.topCategories ?? [];
    expect(categories[0]?.name).toBe("Compras"); // 938.57 + 373.07 = 1311.64
    expect(categories[0]?.total).toBeCloseTo(1311.64, 2);
    expect(categories[1]?.name).toBe("Viagem"); // 1200
  });

  it("lista os lancamentos recentes do mes (mais novos primeiro)", () => {
    const { result } = renderHook(() =>
      useCreditCardDetailScreenController({ creditCardId: "cc-1" }),
    );
    const recent = result.current.detail?.recentTransactions ?? [];
    expect(recent[0]?.id).toBe("tx-1"); // 2026-06-25
    expect(recent.at(-1)?.id).toBe("tx-3"); // 2026-06-10
  });

  it("resolve o gradiente da marca do cartao", () => {
    const { result } = renderHook(() =>
      useCreditCardDetailScreenController({ creditCardId: "cc-1" }),
    );
    expect(result.current.detail?.gradient).toEqual(
      resolveCardGradient({ id: "cc-1", bank: "Inter", name: "Inter padrão" }),
    );
  });

  it("marca tom de perigo no anel acima de 85%", () => {
    mockedUseUtilization.mockReturnValue({
      data: buildUtilization({ utilizationPct: 92 }),
    } as never);
    const { result } = renderHook(() =>
      useCreditCardDetailScreenController({ creditCardId: "cc-1" }),
    );
    expect(result.current.detail?.limit.tone).toBe("danger");
  });

  it("nao monta o view-model quando o cartao nao existe", () => {
    const { result } = renderHook(() =>
      useCreditCardDetailScreenController({ creditCardId: "missing" }),
    );
    expect(result.current.detail).toBeNull();
  });
});

describe("useCreditCardDetailScreenController — resolucao de rota e dados vazios", () => {
  it("resolve o id a partir do parametro de rota (string)", () => {
    const { result } = renderHook(() => useCreditCardDetailScreenController());
    expect(result.current.creditCardId).toBe("cc-1");
    expect(result.current.creditCard?.id).toBe("cc-1");
  });

  it("resolve o id quando o parametro de rota e um array", () => {
    mockRouteParams = { id: ["cc-1", "extra"] };
    const { result } = renderHook(() => useCreditCardDetailScreenController());
    expect(result.current.creditCardId).toBe("cc-1");
  });

  it("monta o view-model mesmo sem transacoes/tags carregadas", () => {
    mockedUseTransactions.mockReturnValue({ data: undefined } as never);
    mockedUseTags.mockReturnValue({ data: undefined } as never);
    mockedUseUtilization.mockReturnValue({ data: null } as never);
    const { result } = renderHook(() =>
      useCreditCardDetailScreenController({ creditCardId: "cc-1" }),
    );
    expect(result.current.detail?.topCategories).toEqual([]);
    expect(result.current.detail?.recentTransactions).toEqual([]);
    expect(result.current.detail?.limit.currentBillTotal).toBe(0);
  });
});

describe("useCreditCardDetailScreenController — acoes rapidas", () => {
  it("handleLaunchExpense abre o sheet de despesa", () => {
    const { result } = renderHook(() =>
      useCreditCardDetailScreenController({ creditCardId: "cc-1" }),
    );
    result.current.handleLaunchExpense();
    expect(mockOpenExpenseSheet).toHaveBeenCalled();
  });

  it("handleBlockCard e handleOpenSettings sao placeholders nao destrutivos", () => {
    const { result } = renderHook(() =>
      useCreditCardDetailScreenController({ creditCardId: "cc-1" }),
    );
    expect(() => {
      result.current.handleBlockCard();
      result.current.handleOpenSettings();
    }).not.toThrow();
    // Placeholders nao navegam nem abrem sheets.
    expect(mockPush).not.toHaveBeenCalled();
    expect(mockOpenExpenseSheet).not.toHaveBeenCalled();
  });
});
