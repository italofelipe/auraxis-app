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

jest.mock("@/features/credit-cards/hooks/use-credit-card-bill-query", () => ({
  useCreditCardBillQuery: jest.fn(),
}));
jest.mock("@/features/credit-cards/hooks/use-credit-cards-query", () => ({
  useCreditCardsQuery: jest.fn(),
}));

const mockedUseBillQuery = jest.mocked(useCreditCardBillQuery);
const mockedUseCardsQuery = jest.mocked(useCreditCardsQuery);

const buildCard = (override: Partial<CreditCard> = {}): CreditCard => ({
  id: "card-1",
  name: "Nubank Ultravioleta",
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

beforeEach(() => {
  mockedUseCardsQuery.mockReturnValue({
    data: { creditCards: [buildCard()] },
  } as never);
  mockedUseBillQuery.mockReturnValue({
    data: buildBill(),
    isLoading: false,
    isError: false,
  } as never);
});

describe("useCreditCardBillScreenController", () => {
  it("resolve cartao e fatura do mes inicial", () => {
    const { result } = renderHook(() =>
      useCreditCardBillScreenController({
        creditCardId: "card-1",
        initialMonth: "2026-05",
      }),
    );

    expect(result.current.creditCard?.name).toBe("Nubank Ultravioleta");
    expect(result.current.bill?.cycle.status).toBe("open");
    expect(result.current.groupedTransactions).toEqual([]);
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
