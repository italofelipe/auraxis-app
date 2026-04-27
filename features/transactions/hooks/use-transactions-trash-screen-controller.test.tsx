import { act, renderHook } from "@testing-library/react-native";

import { useRestoreTransactionMutation } from "@/features/transactions/hooks/use-transaction-mutations";
import { useDeletedTransactionsQuery } from "@/features/transactions/hooks/use-transactions-query";
import { useTransactionsTrashScreenController } from "@/features/transactions/hooks/use-transactions-trash-screen-controller";

jest.mock("@/features/transactions/hooks/use-transactions-query", () => ({
  useDeletedTransactionsQuery: jest.fn(),
}));

jest.mock("@/features/transactions/hooks/use-transaction-mutations", () => ({
  useRestoreTransactionMutation: jest.fn(),
}));

const mockedUseQuery = jest.mocked(useDeletedTransactionsQuery);
const mockedUseRestore = jest.mocked(useRestoreTransactionMutation);

const buildMutationStub = () => ({
  mutateAsync: jest.fn().mockResolvedValue(undefined),
  reset: jest.fn(),
  isPending: false,
  error: null,
});

let restoreStub: ReturnType<typeof buildMutationStub>;

beforeEach(() => {
  restoreStub = buildMutationStub();
  mockedUseRestore.mockReturnValue(restoreStub as never);
  mockedUseQuery.mockReturnValue({
    data: { transactions: [] },
  } as never);
});

describe("useTransactionsTrashScreenController", () => {
  it("retorna lista vazia quando nao ha dados", () => {
    mockedUseQuery.mockReturnValue({ data: undefined } as never);
    const { result } = renderHook(() => useTransactionsTrashScreenController());
    expect(result.current.transactions).toEqual([]);
  });

  it("expoe transacoes excluidas", () => {
    mockedUseQuery.mockReturnValue({
      data: {
        transactions: [
          {
            id: "tx-1",
            title: "Almoco",
            amount: "50.00",
            type: "expense",
            dueDate: "2026-04-10",
            startDate: null,
            endDate: null,
            description: null,
            observation: null,
            isRecurring: false,
            isInstallment: false,
            installmentCount: null,
            tagId: null,
            accountId: null,
            creditCardId: null,
            status: "paid",
            currency: "BRL",
            source: "manual",
            externalId: null,
            bankName: null,
            installmentGroupId: null,
            paidAt: null,
            createdAt: null,
            updatedAt: null,
            deletedAt: "2026-04-12",
          },
        ],
      },
    } as never);
    const { result } = renderHook(() => useTransactionsTrashScreenController());
    expect(result.current.transactions).toHaveLength(1);
  });

  it("handleRestore dispara restoreMutation com id", async () => {
    const { result } = renderHook(() => useTransactionsTrashScreenController());
    await act(async () => {
      await result.current.handleRestore("tx-1");
    });
    expect(restoreStub.mutateAsync).toHaveBeenCalledWith("tx-1");
    expect(result.current.restoringTransactionId).toBeNull();
  });

  it("captura restoreError quando mutation falha", async () => {
    restoreStub.mutateAsync.mockRejectedValueOnce(new Error("boom"));
    const { result } = renderHook(() => useTransactionsTrashScreenController());
    await act(async () => {
      await result.current.handleRestore("tx-2");
    });
    expect(result.current.restoreError).toBeInstanceOf(Error);
  });

  it("dismissRestoreError limpa estado", async () => {
    restoreStub.mutateAsync.mockRejectedValueOnce(new Error("oops"));
    const { result } = renderHook(() => useTransactionsTrashScreenController());
    await act(async () => {
      await result.current.handleRestore("tx-3");
    });
    act(() => {
      result.current.dismissRestoreError();
    });
    expect(result.current.restoreError).toBeNull();
    expect(restoreStub.reset).toHaveBeenCalled();
  });
});
