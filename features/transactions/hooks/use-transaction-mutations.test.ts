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
  useRestoreTransactionMutation,
} from "@/features/transactions/hooks/use-transaction-mutations";
import { transactionFixture } from "@/features/transactions/mocks";

const mockAnalyticsClient: jest.Mocked<AnalyticsClient> = {
  capture: jest.fn(),
  identify: jest.fn(),
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

describe("useTransactionMutations analytics", () => {
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
        string,
        { readonly transaction?: TransactionRecord }
      >;

    const mutationContext = mutation.onMutate?.(deletedTransaction.id);
    await expect(mutation.mutationFn(deletedTransaction.id)).resolves.toBeUndefined();
    await mutation.onSuccess?.(
      undefined,
      deletedTransaction.id,
      mutationContext ?? {},
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
