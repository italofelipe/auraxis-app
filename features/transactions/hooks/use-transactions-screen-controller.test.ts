import { renderHook } from "@testing-library/react-native";

import { useTransactionsQuery } from "@/features/transactions/hooks/use-transactions-query";
import { useTransactionsScreenController } from "@/features/transactions/hooks/use-transactions-screen-controller";

jest.mock("@/features/transactions/hooks/use-transactions-query", () => ({
  useTransactionsQuery: jest.fn(),
}));

const mockedUseQuery = jest.mocked(useTransactionsQuery);

describe("useTransactionsScreenController", () => {
  it("retorna lista vazia e total zero quando nao ha dados", () => {
    mockedUseQuery.mockReturnValue({
      data: undefined,
      isPending: true,
      isError: false,
    } as never);

    const { result } = renderHook(() => useTransactionsScreenController());
    expect(result.current.transactions).toEqual([]);
    expect(result.current.total).toBe(0);
  });

  it("mapeia transacoes em view models e expoe total da paginacao", () => {
    mockedUseQuery.mockReturnValue({
      data: {
        transactions: [
          {
            id: "tx-1",
            title: "Aluguel",
            amount: "2300",
            type: "expense",
            dueDate: "2026-04-10",
            status: "scheduled",
            isRecurring: true,
          },
        ],
        pagination: { total: 42 },
      },
      isPending: false,
      isError: false,
    } as never);

    const { result } = renderHook(() => useTransactionsScreenController());
    expect(result.current.transactions).toEqual([
      {
        id: "tx-1",
        title: "Aluguel",
        amount: "2300",
        type: "expense",
        dueDate: "2026-04-10",
        status: "scheduled",
        isRecurring: true,
      },
    ]);
    expect(result.current.total).toBe(42);
  });
});
