import type {
  CreateTransactionCommand,
  TransactionCollection,
  TransactionSummary,
  UpdateTransactionCommand,
} from "@/features/transactions/contracts";
import {
  useTransactionDetailQuery,
  useTransactionSummaryQuery,
  useTransactionsQuery,
} from "@/features/transactions/hooks/use-transactions-query";
import {
  useCreateTransactionMutation,
  useDeleteTransactionMutation,
  useUpdateTransactionMutation,
} from "@/features/transactions/hooks/use-transaction-mutations";
import { queryKeys } from "@/core/query/query-keys";

const mockCreateApiQuery = jest.fn();
const mockListTransactions = jest.fn();
const mockGetTransaction = jest.fn();
const mockGetSummary = jest.fn();
const mockCreateTransaction = jest.fn();
const mockUpdateTransaction = jest.fn();
const mockDeleteTransaction = jest.fn();
const mockUseMutation = jest.fn();
const mockUseQueryClient = jest.fn();
const mockInvalidateQueries = jest.fn();

jest.mock("@/core/query/create-api-query", () => ({
  createApiQuery: (...args: readonly unknown[]) => mockCreateApiQuery(...args),
}));

jest.mock("@tanstack/react-query", () => ({
  useMutation: (...args: readonly unknown[]) => mockUseMutation(...args),
  useQueryClient: () => mockUseQueryClient(),
}));

jest.mock("@/features/transactions/services/transactions-service", () => ({
  transactionsService: {
    listTransactions: (...args: readonly unknown[]) => mockListTransactions(...args),
    getTransaction: (...args: readonly unknown[]) => mockGetTransaction(...args),
    getSummary: (...args: readonly unknown[]) => mockGetSummary(...args),
    createTransaction: (...args: readonly unknown[]) => mockCreateTransaction(...args),
    updateTransaction: (...args: readonly unknown[]) => mockUpdateTransaction(...args),
    deleteTransaction: (...args: readonly unknown[]) => mockDeleteTransaction(...args),
  },
}));

describe("transactions hooks", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateApiQuery.mockImplementation(
      (queryKey: readonly unknown[], queryFn: () => Promise<unknown>, options?: unknown) => ({
        queryKey,
        queryFn,
        options,
      }),
    );
    mockUseMutation.mockImplementation((options: unknown) => options);
    mockInvalidateQueries.mockResolvedValue(undefined);
    mockUseQueryClient.mockReturnValue({
      invalidateQueries: mockInvalidateQueries,
    });
  });

  it("configura hooks de query para listagem, detalhe e resumo", async () => {
    const listResult: TransactionCollection = {
      transactions: [],
      pagination: { total: 0, page: 1, perPage: 10, pages: 0, hasNextPage: false },
    };
    const summaryResult: TransactionSummary = {
      month: "2026-04",
      incomeTotal: "0.00",
      expenseTotal: "0.00",
      items: [],
      pagination: { total: 0, page: 1, perPage: 10, pages: 0, hasNextPage: false },
    };
    mockListTransactions.mockResolvedValue(listResult);
    mockGetTransaction.mockResolvedValue({ id: "txn-1" });
    mockGetSummary.mockResolvedValue(summaryResult);

    const listQuery = useTransactionsQuery({ status: "pending" }) as unknown as {
      queryKey: readonly unknown[];
      queryFn: () => Promise<TransactionCollection>;
    };
    const detailQuery = useTransactionDetailQuery("txn-1") as unknown as {
      queryKey: readonly unknown[];
      queryFn: () => Promise<unknown>;
      options: { enabled: boolean };
    };
    const summaryQuery = useTransactionSummaryQuery({ month: "2026-04" }) as unknown as {
      queryKey: readonly unknown[];
      queryFn: () => Promise<TransactionSummary>;
    };

    await expect(listQuery.queryFn()).resolves.toEqual(listResult);
    await expect(detailQuery.queryFn()).resolves.toEqual({ id: "txn-1" });
    await expect(summaryQuery.queryFn()).resolves.toEqual(summaryResult);
    expect(listQuery.queryKey).toEqual([...queryKeys.transactions.list(), { status: "pending" }]);
    expect(detailQuery.queryKey).toEqual([...queryKeys.transactions.detail("txn-1"), true]);
    expect(detailQuery.options.enabled).toBe(true);
    expect(summaryQuery.queryKey).toEqual([...queryKeys.transactions.summary(), { month: "2026-04" }]);
  });

  it("desabilita o hook de detalhe sem transactionId", () => {
    const detailQuery = useTransactionDetailQuery(null) as unknown as {
      options: { enabled: boolean };
      queryKey: readonly unknown[];
    };

    expect(detailQuery.options.enabled).toBe(false);
    expect(detailQuery.queryKey).toEqual([...queryKeys.transactions.detail("unknown"), true]);
  });

  it("configura mutation de criacao com invalidacao do dominio", async () => {
    const command: CreateTransactionCommand = {
      title: "Conta de luz",
      amount: "150.00",
      type: "expense",
      dueDate: "2026-04-20",
    };
    mockCreateTransaction.mockResolvedValue({ id: "txn-9" });

    const mutation = useCreateTransactionMutation() as unknown as {
      mutationFn: (input: CreateTransactionCommand) => Promise<unknown>;
      onSuccess: () => Promise<void>;
    };

    await expect(mutation.mutationFn(command)).resolves.toEqual({ id: "txn-9" });
    await mutation.onSuccess();
    expect(mockCreateTransaction).toHaveBeenCalledWith(command);
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: queryKeys.transactions.root,
    });
  });

  it("configura mutation de update e delete com invalidacao do dominio", async () => {
    const payload: UpdateTransactionCommand = { title: "Atualizada" };
    mockUpdateTransaction.mockResolvedValue({ id: "txn-10" });
    mockDeleteTransaction.mockResolvedValue(undefined);

    const updateMutation = useUpdateTransactionMutation() as unknown as {
      mutationFn: (input: {
        readonly transactionId: string;
        readonly payload: UpdateTransactionCommand;
      }) => Promise<unknown>;
      onSuccess: () => Promise<void>;
    };
    const deleteMutation = useDeleteTransactionMutation() as unknown as {
      mutationFn: (transactionId: string) => Promise<void>;
      onSuccess: () => Promise<void>;
    };

    await expect(
      updateMutation.mutationFn({ transactionId: "txn-10", payload }),
    ).resolves.toEqual({ id: "txn-10" });
    await expect(deleteMutation.mutationFn("txn-10")).resolves.toBeUndefined();
    await updateMutation.onSuccess();
    await deleteMutation.onSuccess();
    expect(mockUpdateTransaction).toHaveBeenCalledWith("txn-10", payload);
    expect(mockDeleteTransaction).toHaveBeenCalledWith("txn-10");
    expect(mockInvalidateQueries).toHaveBeenCalledTimes(2);
  });
});
