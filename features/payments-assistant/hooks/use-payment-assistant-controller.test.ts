import { act, renderHook } from "@testing-library/react-native";

import type { TransactionRecord } from "@/features/transactions/contracts";
import { usePaymentAssistantController } from "@/features/payments-assistant/hooks/use-payment-assistant-controller";
import { resetPaymentAssistantSessionForTests } from "@/features/payments-assistant/services/payment-assistant-session";

const mockMarkPaid = jest.fn();
const mockRemove = jest.fn();
const mockUpdate = jest.fn();
const mockRestore = jest.fn();
let mockStartupReady = true;
let mockHasAccess = true;
let mockTransactions: TransactionRecord[] = [];

jest.mock("@/core/shell/app-shell-store", () => ({
  useAppShellStore: (selector: (state: { startupReady: boolean }) => unknown) =>
    selector({ startupReady: mockStartupReady }),
}));
jest.mock("@/features/entitlements/hooks/use-feature-access", () => ({
  useFeatureAccess: () => ({ hasAccess: mockHasAccess, isLoading: false }),
}));
jest.mock("@/features/transactions/hooks/use-transactions-query", () => ({
  useTransactionsQuery: () => ({ data: { transactions: mockTransactions } }),
}));
jest.mock("@/features/transactions/hooks/use-transaction-mutations", () => ({
  useMarkTransactionPaidMutation: () => ({ mutateAsync: mockMarkPaid }),
  useDeleteTransactionMutation: () => ({ mutateAsync: mockRemove }),
  useUpdateTransactionMutation: () => ({ mutateAsync: mockUpdate }),
  useRestoreTransactionMutation: () => ({ mutateAsync: mockRestore }),
}));

const NOW = (): Date => new Date(2026, 5, 29);

const tx = (overrides: Partial<TransactionRecord> = {}): TransactionRecord =>
  ({
    id: "tx",
    title: "Conta",
    amount: "100.00",
    type: "expense",
    dueDate: "2026-04-01",
    status: "pending",
    description: null,
    observation: null,
    paidAt: null,
    createdAt: "2026-03-01T00:00:00Z",
    ...overrides,
  }) as TransactionRecord;

const renderController = () => renderHook(() => usePaymentAssistantController({ now: NOW }));

describe("usePaymentAssistantController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetPaymentAssistantSessionForTests();
    mockStartupReady = true;
    mockHasAccess = true;
    mockTransactions = [
      tx({ id: "a", dueDate: "2026-02-01" }),
      tx({ id: "b", dueDate: "2026-03-01" }),
      tx({ id: "recent", dueDate: "2026-06-25" }),
      tx({ id: "settled", status: "paid", dueDate: "2026-01-01" }),
    ];
    mockMarkPaid.mockResolvedValue(undefined);
    mockRemove.mockResolvedValue(undefined);
    mockUpdate.mockResolvedValue(undefined);
    mockRestore.mockResolvedValue(undefined);
  });

  it("auto-opens for a Premium user with overdue candidates, oldest first", () => {
    const { result } = renderController();
    expect(result.current.isVisible).toBe(true);
    expect(result.current.current?.id).toBe("a");
    expect(result.current.progress).toEqual({ current: 1, total: 2 });
  });

  it("does not auto-open for non-Premium users", () => {
    mockHasAccess = false;
    const { result } = renderController();
    expect(result.current.isVisible).toBe(false);
  });

  it("does not auto-open before startup is ready", () => {
    mockStartupReady = false;
    const { result } = renderController();
    expect(result.current.isVisible).toBe(false);
  });

  it("pays the current card and advances", async () => {
    const { result } = renderController();
    await act(async () => {
      await result.current.pay();
    });
    expect(mockMarkPaid).toHaveBeenCalledWith({ transactionId: "a", paidAt: "2026-06-29" });
    expect(result.current.current?.id).toBe("b");
  });

  it("discards the current card via soft-delete and advances", async () => {
    const { result } = renderController();
    await act(async () => {
      await result.current.discard();
    });
    expect(mockRemove).toHaveBeenCalledWith({ transactionId: "a", scope: "occurrence" });
    expect(result.current.current?.id).toBe("b");
  });

  it("marks all remaining cards as paid", async () => {
    const { result } = renderController();
    await act(async () => {
      await result.current.markAllPaid();
    });
    expect(mockMarkPaid).toHaveBeenCalledTimes(2);
    expect(result.current.isDone).toBe(true);
  });

  it("undoes a payment by reverting to pending", async () => {
    const { result } = renderController();
    await act(async () => {
      await result.current.pay();
    });
    await act(async () => {
      await result.current.undo();
    });
    expect(mockUpdate).toHaveBeenCalledWith({
      transactionId: "a",
      payload: { status: "pending", paidAt: null },
    });
    expect(result.current.current?.id).toBe("a");
  });

  it("undoes a delete by restoring the transaction", async () => {
    const { result } = renderController();
    await act(async () => {
      await result.current.discard();
    });
    await act(async () => {
      await result.current.undo();
    });
    expect(mockRestore).toHaveBeenCalledWith("a");
  });
});
