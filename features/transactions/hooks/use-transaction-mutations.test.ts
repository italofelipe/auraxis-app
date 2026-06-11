import type { AnalyticsClient } from "@/core/observability/analytics-types";
import { queryKeys } from "@/core/query/query-keys";
import type {
  CreateTransactionCommand,
  TransactionCollection,
  TransactionRecord,
} from "@/features/transactions/contracts";
import {
  useCreateTransactionMutation,
  useDeleteTransactionMutation,
  useMarkTransactionPaidMutation,
  useRestoreTransactionMutation,
} from "@/features/transactions/hooks/use-transaction-mutations";
import { transactionFixture } from "@/features/transactions/mocks";

const mockAnalyticsClient: jest.Mocked<AnalyticsClient> = {
  capture: jest.fn(),
  identify: jest.fn(),
  screen: jest.fn(),
  reset: jest.fn(),
};
const mockUseMutation = jest.fn();
const mockUseQueryClient = jest.fn();
const mockInvalidateQueries = jest.fn();
const mockGetQueriesData = jest.fn();
const mockCreateTransaction = jest.fn();
const mockUpdateTransaction = jest.fn();
const mockDeleteTransaction = jest.fn();
const mockRestoreTransaction = jest.fn();
const mockMarkTransactionPaid = jest.fn();

jest.mock("@tanstack/react-query", () => ({
  useMutation: (...args: readonly unknown[]) => mockUseMutation(...args),
  useQueryClient: () => mockUseQueryClient(),
}));

jest.mock("@/core/observability/use-analytics", () => ({
  useAnalytics: () => mockAnalyticsClient,
}));

jest.mock("@/features/transactions/services/transactions-service", () => ({
  transactionsService: {
    createTransaction: (...args: readonly unknown[]) =>
      mockCreateTransaction(...args),
    updateTransaction: (...args: readonly unknown[]) =>
      mockUpdateTransaction(...args),
    deleteTransaction: (...args: readonly unknown[]) =>
      mockDeleteTransaction(...args),
    restoreTransaction: (...args: readonly unknown[]) =>
      mockRestoreTransaction(...args),
    markTransactionPaid: (...args: readonly unknown[]) =>
      mockMarkTransactionPaid(...args),
  },
}));

interface MutationConfig<TData, TVariables, TContext = unknown> {
  readonly mutationFn: (variables: TVariables) => Promise<TData>;
  readonly onMutate?: (variables: TVariables) => TContext;
  readonly onSuccess?: (
    data: TData,
    variables: TVariables,
    onMutateResult: TContext,
  ) => Promise<void>;
}

const buildCollection = (
  transaction: TransactionRecord,
): TransactionCollection => ({
  transactions: [transaction],
  pagination: {
    total: 1,
    page: 1,
    perPage: 10,
    pages: 1,
    hasNextPage: false,
  },
});

const expectedAnalyticsProperties = (
  transaction: TransactionRecord,
) => ({
  transactionType: transaction.type,
  source: transaction.source,
  status: transaction.status,
  isRecurring: transaction.isRecurring,
  isInstallment: transaction.isInstallment,
  currency: transaction.currency,
});

beforeEach(() => {
  jest.clearAllMocks();
  mockUseMutation.mockImplementation((options: unknown) => options);
  mockInvalidateQueries.mockResolvedValue(undefined);
  mockGetQueriesData.mockReturnValue([]);
  mockUseQueryClient.mockReturnValue({
    invalidateQueries: mockInvalidateQueries,
    getQueriesData: mockGetQueriesData,
  });
});

describe("useTransactionMutations analytics", () => {
  it("captures transaction.created without PII when creation succeeds", async () => {
    const command: CreateTransactionCommand = {
      title: "Confidential vendor",
      amount: "123.45",
      type: "expense",
      dueDate: "2026-05-17",
      description: "private memo",
    };
    const createdTransaction: TransactionRecord = {
      ...transactionFixture,
      id: "tx-created",
      title: command.title,
      type: "expense",
      source: "manual",
    };
    mockCreateTransaction.mockResolvedValue(createdTransaction);

    const mutation =
      useCreateTransactionMutation() as unknown as MutationConfig<
        TransactionRecord,
        CreateTransactionCommand
      >;

    await expect(mutation.mutationFn(command)).resolves.toEqual(
      createdTransaction,
    );
    await mutation.onSuccess?.(createdTransaction, command, undefined);

    expect(mockAnalyticsClient.capture).toHaveBeenCalledWith(
      "transaction.created",
      expectedAnalyticsProperties(createdTransaction),
    );
    expect(JSON.stringify(mockAnalyticsClient.capture.mock.calls)).not.toContain(
      command.title,
    );
    expect(JSON.stringify(mockAnalyticsClient.capture.mock.calls)).not.toContain(
      command.description,
    );
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: queryKeys.transactions.root,
    });
  });

  it("captures transaction.deleted using cached non-PII properties", async () => {
    const deletedTransaction: TransactionRecord = {
      ...transactionFixture,
      id: "tx-deleted",
      title: "Private deleted title",
      type: "income",
      source: "import",
    };
    mockGetQueriesData.mockReturnValue([
      [queryKeys.transactions.list(), buildCollection(deletedTransaction)],
    ]);
    mockDeleteTransaction.mockResolvedValue(undefined);

    const mutation =
      useDeleteTransactionMutation() as unknown as MutationConfig<
        void,
        { readonly transactionId: string; readonly scope?: "occurrence" | "series" },
        { readonly transaction?: TransactionRecord }
      >;

    const variables = { transactionId: deletedTransaction.id } as const;
    const mutationContext = mutation.onMutate?.(variables);
    await expect(mutation.mutationFn(variables)).resolves.toBeUndefined();
    await mutation.onSuccess?.(undefined, variables, mutationContext ?? {});

    expect(mockDeleteTransaction).toHaveBeenCalledWith(
      deletedTransaction.id,
      "occurrence",
    );
    expect(mutationContext).toEqual({ transaction: deletedTransaction });
    expect(mockAnalyticsClient.capture).toHaveBeenCalledWith(
      "transaction.deleted",
      expectedAnalyticsProperties(deletedTransaction),
    );
    expect(JSON.stringify(mockAnalyticsClient.capture.mock.calls)).not.toContain(
      deletedTransaction.title,
    );
  });

  it("captures transaction.restored without PII when restore succeeds", async () => {
    const restoredTransaction: TransactionRecord = {
      ...transactionFixture,
      id: "tx-restored",
      title: "Restored private title",
      type: "expense",
      source: "manual",
    };
    mockRestoreTransaction.mockResolvedValue(restoredTransaction);

    const mutation =
      useRestoreTransactionMutation() as unknown as MutationConfig<
        TransactionRecord,
        string
      >;

    await expect(mutation.mutationFn(restoredTransaction.id)).resolves.toEqual(
      restoredTransaction,
    );
    await mutation.onSuccess?.(
      restoredTransaction,
      restoredTransaction.id,
      undefined,
    );

    expect(mockAnalyticsClient.capture).toHaveBeenCalledWith(
      "transaction.restored",
      expectedAnalyticsProperties(restoredTransaction),
    );
    expect(JSON.stringify(mockAnalyticsClient.capture.mock.calls)).not.toContain(
      restoredTransaction.title,
    );
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: queryKeys.transactions.root,
    });
  });
});

describe("useTransactionMutations pay + delete scope", () => {
  it("repassa scope series ao service ao excluir serie inteira", async () => {
    mockDeleteTransaction.mockResolvedValue(undefined);

    const mutation =
      useDeleteTransactionMutation() as unknown as MutationConfig<
        void,
        { readonly transactionId: string; readonly scope?: "occurrence" | "series" },
        { readonly transaction?: TransactionRecord }
      >;

    await expect(
      mutation.mutationFn({ transactionId: "tx-series", scope: "series" }),
    ).resolves.toBeUndefined();

    expect(mockDeleteTransaction).toHaveBeenCalledWith("tx-series", "series");
  });

  it("captures transaction.paid without PII when mark paid succeeds", async () => {
    const paidTransaction: TransactionRecord = {
      ...transactionFixture,
      id: "tx-paid",
      title: "Private paid title",
      type: "expense",
      source: "manual",
      status: "paid",
      paidAt: "2026-06-11",
    };
    mockMarkTransactionPaid.mockResolvedValue(paidTransaction);

    const mutation =
      useMarkTransactionPaidMutation() as unknown as MutationConfig<
        TransactionRecord,
        { readonly transactionId: string; readonly paidAt: string }
      >;

    await expect(
      mutation.mutationFn({ transactionId: paidTransaction.id, paidAt: "2026-06-11" }),
    ).resolves.toEqual(paidTransaction);
    await mutation.onSuccess?.(
      paidTransaction,
      { transactionId: paidTransaction.id, paidAt: "2026-06-11" },
      undefined,
    );

    expect(mockMarkTransactionPaid).toHaveBeenCalledWith("tx-paid", "2026-06-11");
    expect(mockAnalyticsClient.capture).toHaveBeenCalledWith(
      "transaction.paid",
      expectedAnalyticsProperties(paidTransaction),
    );
    expect(JSON.stringify(mockAnalyticsClient.capture.mock.calls)).not.toContain(
      paidTransaction.title,
    );
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: queryKeys.transactions.root,
    });
  });
});
