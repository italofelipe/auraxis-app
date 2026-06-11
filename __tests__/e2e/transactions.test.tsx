/**
 * E2E — Transactions CRUD flow (RNTL + MSW)
 *
 * Integration tests for the transactions feature domain.
 * Tests query hooks, mutation hooks, and the screen controller using
 * service-layer mocks. MSW server lifecycle is maintained for future
 * fetch-based interceptors.
 *
 * Closes #375
 */
import { act, renderHook, waitFor } from "@testing-library/react-native";

import { server } from "@/__mocks__/msw-server";
import { handlers } from "@/__tests__/e2e/handlers";
import {
  transactionCollectionFixture,
  transactionFixture,
} from "@/features/transactions/mocks";
import { transactionsService } from "@/features/transactions/services/transactions-service";
import { createTestQueryClient } from "@/shared/testing/test-query-client";
import { createTestHookWrapper } from "@/shared/testing/test-providers";

// Setup MSW handlers for this suite (lifecycle integration)
beforeEach(() => {
  server.use(...handlers);
});

// ---------------------------------------------------------------------------
// Service-layer mocks (axios uses Node http — MSW native intercepts fetch/XHR)
// ---------------------------------------------------------------------------
jest.mock("@/features/transactions/services/transactions-service", () => ({
  transactionsService: {
    listTransactions: jest.fn(),
    createTransaction: jest.fn(),
    updateTransaction: jest.fn(),
    deleteTransaction: jest.fn(),
    getSummary: jest.fn(),
    getTransaction: jest.fn(),
    listDeleted: jest.fn(),
    restoreTransaction: jest.fn(),
    exportTransactions: jest.fn(),
  },
}));

jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    canGoBack: jest.fn(() => false),
  }),
  usePathname: jest.fn(() => "/"),
  useLocalSearchParams: jest.fn(() => ({})),
  useSegments: jest.fn(() => []),
  Link: ({ children }: { children: React.ReactNode }) => children,
  Redirect: () => null,
  Stack: { Screen: () => null },
  Tabs: { Screen: () => null },
}));

const mockedTransactionsService = jest.mocked(transactionsService);

// ---------------------------------------------------------------------------
// Transactions E2E: list, create, update, delete
// ---------------------------------------------------------------------------

describe("Transactions E2E flow", () => {
  let queryClient: ReturnType<typeof createTestQueryClient>;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    mockedTransactionsService.listTransactions.mockResolvedValue(
      transactionCollectionFixture,
    );
    mockedTransactionsService.createTransaction.mockResolvedValue(
      transactionFixture,
    );
    mockedTransactionsService.updateTransaction.mockResolvedValue({
      ...transactionFixture,
      title: "Salario atualizado",
    });
    mockedTransactionsService.deleteTransaction.mockResolvedValue(undefined);
  });

  it("loads and exposes transaction list from service", async () => {
    const {
      useTransactionsQuery,
      // eslint-disable-next-line @typescript-eslint/no-require-imports
    } = require("@/features/transactions/hooks/use-transactions-query");

    const wrapper = createTestHookWrapper({ queryClient });
    const { result } = renderHook(() => useTransactionsQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.transactions).toHaveLength(
      transactionCollectionFixture.transactions.length,
    );
    expect(result.current.data?.transactions[0].title).toBe(
      transactionCollectionFixture.transactions[0].title,
    );
  });

  it("creates a new transaction and resolves with the created record", async () => {
    const {
      useCreateTransactionMutation,
      // eslint-disable-next-line @typescript-eslint/no-require-imports
    } = require("@/features/transactions/hooks/use-transaction-mutations");

    const wrapper = createTestHookWrapper({ queryClient });
    const { result } = renderHook(() => useCreateTransactionMutation(), {
      wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync({
        title: "Nova transacao de teste",
        amount: "500.00",
        type: "expense",
        dueDate: "2026-05-01",
        status: "pending",
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(mockedTransactionsService.createTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Nova transacao de teste",
        amount: "500.00",
        type: "expense",
      }),
    );
  });

  it("updates a transaction via the update mutation", async () => {
    const {
      useUpdateTransactionMutation,
      // eslint-disable-next-line @typescript-eslint/no-require-imports
    } = require("@/features/transactions/hooks/use-transaction-mutations");

    const wrapper = createTestHookWrapper({ queryClient });
    const { result } = renderHook(() => useUpdateTransactionMutation(), {
      wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync({
        transactionId: transactionFixture.id,
        payload: { title: "Salario atualizado" },
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(mockedTransactionsService.updateTransaction).toHaveBeenCalledWith(
      transactionFixture.id,
      { title: "Salario atualizado" },
    );
  });

  it("deletes a transaction via the delete mutation", async () => {
    const {
      useDeleteTransactionMutation,
      // eslint-disable-next-line @typescript-eslint/no-require-imports
    } = require("@/features/transactions/hooks/use-transaction-mutations");

    const wrapper = createTestHookWrapper({ queryClient });
    const { result } = renderHook(() => useDeleteTransactionMutation(), {
      wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync({ transactionId: transactionFixture.id });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(mockedTransactionsService.deleteTransaction).toHaveBeenCalledWith(
      transactionFixture.id,
      "occurrence",
    );
  });

  it("returns error state when list service rejects", async () => {
    mockedTransactionsService.listTransactions.mockRejectedValueOnce(
      new Error("Network error"),
    );

    const {
      useTransactionsQuery,
      // eslint-disable-next-line @typescript-eslint/no-require-imports
    } = require("@/features/transactions/hooks/use-transactions-query");

    const wrapper = createTestHookWrapper({ queryClient });
    const { result } = renderHook(() => useTransactionsQuery(), { wrapper });

    await waitFor(
      () => {
        expect(result.current.isError).toBe(true);
      },
      { timeout: 5000 },
    );
  });

  it("screen controller derives view models from transaction list", async () => {
    const {
      useTransactionsScreenController,
      // eslint-disable-next-line @typescript-eslint/no-require-imports
    } = require("@/features/transactions/hooks/use-transactions-screen-controller");

    const wrapper = createTestHookWrapper({ queryClient });
    const { result } = renderHook(
      () => useTransactionsScreenController(),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.transactions.length).toBeGreaterThan(0);
    });

    const firstTx = result.current.transactions[0];
    expect(firstTx).toHaveProperty("id");
    expect(firstTx).toHaveProperty("title");
    expect(firstTx).toHaveProperty("amount");
    expect(firstTx).toHaveProperty("type");
    expect(firstTx.title).toBe(transactionCollectionFixture.transactions[0].title);
  });
});
