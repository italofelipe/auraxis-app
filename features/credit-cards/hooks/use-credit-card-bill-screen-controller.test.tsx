import { act, renderHook } from "@testing-library/react-native";

import type {
  CreditCard,
  CreditCardBillRecord,
} from "@/features/credit-cards/contracts";
import { useCreditCardBillQuery } from "@/features/credit-cards/hooks/use-credit-card-bill-query";
import {
  groupCreditCardBillTransactionsByDate,
  shiftCreditCardBillMonth,
  useCreditCardBillScreenController,
} from "@/features/credit-cards/hooks/use-credit-card-bill-screen-controller";
import { useCreditCardsQuery } from "@/features/credit-cards/hooks/use-credit-cards-query";
import { useTagsQuery } from "@/features/tags/hooks/use-tags-query";
import type { TransactionRecord } from "@/features/transactions/contracts";
import { useTransactionsQuery } from "@/features/transactions/hooks/use-transactions-query";
import { resolveCardGradient } from "@/shared/theme";

const mockRouterBack = jest.fn();
const mockRouterReplace = jest.fn();
let mockCanGoBack = true;

jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: mockRouterBack,
    replace: mockRouterReplace,
    canGoBack: () => mockCanGoBack,
  }),
  useLocalSearchParams: () => ({ id: "card-1" }),
}));

jest.mock("@/features/credit-cards/hooks/use-credit-card-bill-query", () => ({
  useCreditCardBillQuery: jest.fn(),
}));
jest.mock("@/features/credit-cards/hooks/use-credit-cards-query", () => ({
  useCreditCardsQuery: jest.fn(),
}));
jest.mock("@/features/tags/hooks/use-tags-query", () => ({
  useTagsQuery: jest.fn(),
}));
jest.mock("@/features/transactions/hooks/use-transactions-query", () => ({
  useTransactionsQuery: jest.fn(),
}));

const mockedUseBillQuery = jest.mocked(useCreditCardBillQuery);
const mockedUseCardsQuery = jest.mocked(useCreditCardsQuery);
const mockedUseTagsQuery = jest.mocked(useTagsQuery);
const mockedUseTransactionsQuery = jest.mocked(useTransactionsQuery);

const buildCard = (override: Partial<CreditCard> = {}): CreditCard => ({
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
  ...override,
});

const buildBill = (
  override: Partial<CreditCardBillRecord> = {},
): CreditCardBillRecord => ({
  cycle: {
    startDate: "2026-04-11",
    endDate: "2026-05-10",
    dueDate: "2026-05-20",
    status: "open",
  },
  transactions: [],
  totalAmount: 0,
  paidAmount: 0,
  pendingAmount: 0,
  ...override,
});

const buildTransaction = (
  override: Partial<TransactionRecord> = {},
): TransactionRecord => ({
  id: "tx-1",
  title: "Renner",
  amount: "938.57",
  type: "expense",
  dueDate: "2026-05-05",
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

const setTransactions = (transactions: readonly TransactionRecord[]): void => {
  mockedUseTransactionsQuery.mockReturnValue({
    data: { transactions, pagination: { total: transactions.length } },
    isLoading: false,
    isError: false,
  } as never);
};

beforeEach(() => {
  jest.clearAllMocks();
  mockCanGoBack = true;
  mockedUseCardsQuery.mockReturnValue({
    data: { creditCards: [buildCard()] },
  } as never);
  mockedUseBillQuery.mockReturnValue({
    data: buildBill(),
    isLoading: false,
    isError: false,
  } as never);
  mockedUseTagsQuery.mockReturnValue({
    data: {
      tags: [
        { id: "tag-compras", name: "Compras", color: "#9B5DE5", icon: null },
        { id: "tag-viagem", name: "Viagem", color: "#00BBF9", icon: null },
      ],
    },
  } as never);
  setTransactions([
    buildTransaction(),
    buildTransaction({
      id: "tx-2",
      title: "Apple Store",
      amount: "373.07",
      dueDate: "2026-05-02",
    }),
    buildTransaction({
      id: "tx-3",
      title: "Latam",
      amount: "1200.00",
      tagId: "tag-viagem",
      dueDate: "2026-05-08",
    }),
  ]);
});

describe("useCreditCardBillScreenController — base", () => {
  it("resolve cartao e fatura do mes inicial", () => {
    const { result } = renderHook(() =>
      useCreditCardBillScreenController({
        creditCardId: "card-1",
        initialMonth: "2026-05",
      }),
    );

    expect(result.current.creditCard?.name).toBe("Inter padrão");
    expect(result.current.bill?.cycle.status).toBe("open");
    expect(mockedUseBillQuery).toHaveBeenCalledWith("card-1", "2026-05");
  });

  it("alterna meses para frente e para tras", () => {
    const { result } = renderHook(() =>
      useCreditCardBillScreenController({
        creditCardId: "card-1",
        initialMonth: "2026-05",
      }),
    );

    act(() => {
      result.current.handleNextMonth();
    });
    expect(result.current.selectedMonth).toBe("2026-06");

    act(() => {
      result.current.handlePreviousMonth();
    });
    expect(result.current.selectedMonth).toBe("2026-05");
  });
});

describe("useCreditCardBillScreenController — janela de transacoes", () => {
  it("consulta despesas do cartao selecionado ate o fim do mes", () => {
    renderHook(() =>
      useCreditCardBillScreenController({
        creditCardId: "card-1",
        initialMonth: "2026-05",
      }),
    );
    expect(mockedUseTransactionsQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "expense",
        creditCardId: "card-1",
        endDate: "2026-05-31",
      }),
    );
  });
});

describe("useCreditCardBillScreenController — view-model da fatura", () => {
  it("resolve o gradiente da marca do cartao no hero", () => {
    const { result } = renderHook(() =>
      useCreditCardBillScreenController({
        creditCardId: "card-1",
        initialMonth: "2026-05",
      }),
    );
    expect(result.current.invoice?.gradient).toEqual(
      resolveCardGradient({ id: "card-1", bank: "Inter", name: "Inter padrão" }),
    );
  });

  it("usa o total oficial da fatura quando disponivel", () => {
    mockedUseBillQuery.mockReturnValue({
      data: buildBill({ totalAmount: 8144.01 }),
      isLoading: false,
      isError: false,
    } as never);
    const { result } = renderHook(() =>
      useCreditCardBillScreenController({
        creditCardId: "card-1",
        initialMonth: "2026-05",
      }),
    );
    expect(result.current.invoice?.total).toBe(8144.01);
  });

  it("deriva o total das transacoes quando nao ha total oficial", () => {
    mockedUseBillQuery.mockReturnValue({
      data: null,
      isLoading: false,
      isError: false,
    } as never);
    const { result } = renderHook(() =>
      useCreditCardBillScreenController({
        creditCardId: "card-1",
        initialMonth: "2026-05",
      }),
    );
    // 938.57 + 373.07 + 1200 = 2511.64 caem na fatura de maio.
    expect(result.current.invoice?.total).toBeCloseTo(2511.64, 2);
  });

  it("monta a pilula de status e o dia de vencimento (DD/MM)", () => {
    const { result } = renderHook(() =>
      useCreditCardBillScreenController({
        creditCardId: "card-1",
        initialMonth: "2026-05",
      }),
    );
    expect(result.current.invoice?.status?.label).toBe("Aberta");
    expect(result.current.invoice?.dueDateLabel).toBe("20/05");
  });

  it("monta o breakdown por categoria (ordenado por total desc)", () => {
    const { result } = renderHook(() =>
      useCreditCardBillScreenController({
        creditCardId: "card-1",
        initialMonth: "2026-05",
      }),
    );
    const breakdown = result.current.invoice?.categoryBreakdown ?? [];
    // Compras = 938.57 + 373.07 = 1311.64 > Viagem = 1200.
    expect(breakdown[0]?.label).toBe("Compras");
    expect(breakdown[0]?.value).toBeCloseTo(1311.64, 2);
    expect(breakdown[1]?.label).toBe("Viagem");
    expect(breakdown[1]?.value).toBe(1200);
  });

  it("agrupa os itens por categoria com total da categoria", () => {
    const { result } = renderHook(() =>
      useCreditCardBillScreenController({
        creditCardId: "card-1",
        initialMonth: "2026-05",
      }),
    );
    const groups = result.current.invoice?.groupedByCategory ?? [];
    expect(groups[0]?.name).toBe("Compras");
    expect(groups[0]?.items).toHaveLength(2);
    expect(groups[0]?.total).toBeCloseTo(1311.64, 2);
    expect(groups[1]?.name).toBe("Viagem");
    expect(groups[1]?.items).toHaveLength(1);
  });

  it("nao monta o view-model quando o cartao nao existe", () => {
    mockedUseCardsQuery.mockReturnValue({
      data: { creditCards: [] },
    } as never);
    const { result } = renderHook(() =>
      useCreditCardBillScreenController({
        creditCardId: "missing",
        initialMonth: "2026-05",
      }),
    );
    expect(result.current.invoice).toBeNull();
  });
});

describe("useCreditCardBillScreenController — pagar fatura", () => {
  it("handlePayBill e um placeholder nao destrutivo", () => {
    const { result } = renderHook(() =>
      useCreditCardBillScreenController({
        creditCardId: "card-1",
        initialMonth: "2026-05",
      }),
    );
    expect(() => result.current.handlePayBill()).not.toThrow();
  });
});

describe("useCreditCardBillScreenController — navegacao e ciclo", () => {
  it("handleBack volta quando ha historico", () => {
    mockCanGoBack = true;
    const { result } = renderHook(() =>
      useCreditCardBillScreenController({ creditCardId: "card-1" }),
    );
    result.current.handleBack();
    expect(mockRouterBack).toHaveBeenCalled();
    expect(mockRouterReplace).not.toHaveBeenCalled();
  });

  it("handleBack cai para a lista de cartoes sem historico", () => {
    mockCanGoBack = false;
    const { result } = renderHook(() =>
      useCreditCardBillScreenController({ creditCardId: "card-1" }),
    );
    result.current.handleBack();
    expect(mockRouterReplace).toHaveBeenCalledWith("/cartoes");
  });

  it("monta cycleLabel e agrupa transacoes oficiais por data", () => {
    mockedUseBillQuery.mockReturnValue({
      data: buildBill({
        transactions: [
          { id: "b1", title: "Mercado", amount: 50, dueDate: "2026-05-10", status: "paid", type: "expense" },
          { id: "b2", title: "Streaming", amount: 40, dueDate: "2026-05-20", status: "pending", type: "expense" },
        ],
      }),
      isLoading: false,
      isError: false,
    } as never);
    const { result } = renderHook(() =>
      useCreditCardBillScreenController({
        creditCardId: "card-1",
        initialMonth: "2026-05",
      }),
    );
    expect(result.current.cycleLabel).toMatch(/vence/u);
    expect(result.current.groupedTransactions.map((group) => group.key)).toEqual([
      "2026-05-10",
      "2026-05-20",
    ]);
  });

  it("resolve o id do cartao a partir do parametro de rota", () => {
    const { result } = renderHook(() => useCreditCardBillScreenController());
    expect(result.current.creditCardId).toBe("card-1");
  });
});

describe("credit card bill helpers", () => {
  it("troca ano ao navegar meses", () => {
    expect(shiftCreditCardBillMonth("2026-01", -1)).toBe("2025-12");
    expect(shiftCreditCardBillMonth("2026-12", 1)).toBe("2027-01");
  });

  it("agrupa transacoes por dueDate ordenada", () => {
    const groups = groupCreditCardBillTransactionsByDate([
      {
        id: "tx-2",
        title: "Streaming",
        amount: 40,
        dueDate: "2026-05-20",
        status: "pending",
        type: "expense",
      },
      {
        id: "tx-1",
        title: "Mercado",
        amount: 250,
        dueDate: "2026-05-10",
        status: "paid",
        type: "expense",
      },
      {
        id: "tx-3",
        title: "Sem data",
        amount: 10,
        dueDate: null,
        status: "pending",
        type: "expense",
      },
    ]);

    expect(groups.map((group) => group.key)).toEqual([
      "2026-05-10",
      "2026-05-20",
      "without-date",
    ]);
    expect(groups[0]?.transactions).toHaveLength(1);
  });
});
