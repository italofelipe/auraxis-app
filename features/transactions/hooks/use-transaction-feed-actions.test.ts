import { act, renderHook } from "@testing-library/react-native";

import { useTransactionFeedActions } from "@/features/transactions/hooks/use-transaction-feed-actions";
import type { TransactionsFeedController } from "@/features/transactions/hooks/use-transactions-feed-controller";
import type { TransactionViewModel } from "@/features/transactions/hooks/use-transactions-screen-controller";

const vm = (overrides: Partial<TransactionViewModel> = {}): TransactionViewModel => ({
  id: "tx-1",
  title: "Impostos",
  amount: "2000.00",
  type: "expense",
  dueDate: "2026-06-29",
  status: "pending",
  description: null,
  observation: null,
  isRecurring: false,
  isInstallment: false,
  installmentCount: null,
  installmentGroupId: null,
  installmentNumber: null,
  ...overrides,
});

const mockHandleOpenEdit = jest.fn();
const mockHandleDuplicate = jest.fn();
const mockHandleShowGroup = jest.fn();

const buildController = (
  overrides: Partial<TransactionsFeedController> = {},
): TransactionsFeedController =>
  ({
    transactions: [vm()],
    transactionsQuery: { data: { transactions: [{ ...vm(), tagId: null }] } },
    payingTransactionId: null,
    duplicatingTransactionId: null,
    deletingTransactionId: null,
    handleOpenEdit: mockHandleOpenEdit,
    handleDuplicate: mockHandleDuplicate,
    handleShowInstallmentGroup: mockHandleShowGroup,
    ...overrides,
  }) as unknown as TransactionsFeedController;

beforeEach(() => jest.clearAllMocks());

describe("useTransactionFeedActions", () => {
  it("abre e fecha o action sheet pelo id", () => {
    const { result } = renderHook(() => useTransactionFeedActions(buildController()));
    expect(result.current.actionTarget).toBeNull();
    act(() => result.current.handlers.openActions("tx-1"));
    expect(result.current.actionTarget?.id).toBe("tx-1");
    act(() => result.current.closeActions());
    expect(result.current.actionTarget).toBeNull();
  });

  it("requestPay define o alvo de pagamento e fecha o sheet", () => {
    const { result } = renderHook(() => useTransactionFeedActions(buildController()));
    act(() => result.current.handlers.openActions("tx-1"));
    act(() => result.current.handlers.requestPay("tx-1"));
    expect(result.current.actionTarget).toBeNull();
    expect(result.current.payTarget).toEqual({ id: "tx-1", title: "Impostos" });
  });

  it("requestDelete marca série quando recorrente/parcelada", () => {
    const controller = buildController({
      transactions: [vm({ isInstallment: true })],
    });
    const { result } = renderHook(() => useTransactionFeedActions(controller));
    act(() => result.current.handlers.requestDelete("tx-1"));
    expect(result.current.deleteTarget?.isSeries).toBe(true);
  });

  it("handleEdit delega para o controller com o registro cru", () => {
    const { result } = renderHook(() => useTransactionFeedActions(buildController()));
    act(() => result.current.handleEdit("tx-1"));
    expect(mockHandleOpenEdit).toHaveBeenCalled();
  });

  it("handleDuplicate e handleShowInstallmentGroup delegam ao controller", () => {
    const { result } = renderHook(() => useTransactionFeedActions(buildController()));
    act(() => result.current.handleDuplicate("tx-1"));
    act(() => result.current.handleShowInstallmentGroup("grp-1"));
    expect(mockHandleDuplicate).toHaveBeenCalledWith("tx-1");
    expect(mockHandleShowGroup).toHaveBeenCalledWith("grp-1");
  });

  it("ignora ids inexistentes sem definir alvos", () => {
    const { result } = renderHook(() => useTransactionFeedActions(buildController()));
    act(() => result.current.handlers.openActions("nope"));
    act(() => result.current.handlers.requestPay("nope"));
    expect(result.current.actionTarget).toBeNull();
    expect(result.current.payTarget).toBeNull();
  });
});
