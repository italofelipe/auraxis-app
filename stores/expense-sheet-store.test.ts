import { act } from "@testing-library/react-native";

import {
  resetExpenseSheetStore,
  useExpenseSheetStore,
} from "@/stores/expense-sheet-store";
import type { TransactionRecord } from "@/features/transactions/contracts";

const buildTransaction = (
  override: Partial<TransactionRecord> = {},
): TransactionRecord => ({
  id: "tx-1",
  title: "Mercado",
  amount: "120.50",
  type: "expense",
  dueDate: "2026-06-20",
  startDate: null,
  endDate: null,
  description: "Compra semanal",
  observation: null,
  isRecurring: false,
  isInstallment: false,
  installmentCount: null,
  recurrenceInterval: 1,
  recurrenceUnit: "month",
  tagId: "tag-food",
  accountId: "acc-1",
  creditCardId: "cc-1",
  status: "pending",
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

describe("useExpenseSheetStore", () => {
  beforeEach(() => {
    resetExpenseSheetStore();
  });

  it("começa fechado", () => {
    expect(useExpenseSheetStore.getState().isOpen).toBe(false);
  });

  it("open() abre o sheet", () => {
    act(() => {
      useExpenseSheetStore.getState().open();
    });
    expect(useExpenseSheetStore.getState().isOpen).toBe(true);
    expect(useExpenseSheetStore.getState().request).toEqual({ mode: "create" });
  });

  it("openCreate() abre com cartão e mês predefinidos", () => {
    act(() => {
      useExpenseSheetStore
        .getState()
        .openCreate({ presetCreditCardId: "cc-1", presetMonth: "2026-06" });
    });

    expect(useExpenseSheetStore.getState().isOpen).toBe(true);
    expect(useExpenseSheetStore.getState().request).toEqual({
      mode: "create",
      presetCreditCardId: "cc-1",
      presetMonth: "2026-06",
    });
  });

  it("openEdit() abre com a transação de origem", () => {
    const transaction = buildTransaction();

    act(() => {
      useExpenseSheetStore.getState().openEdit(transaction);
    });

    expect(useExpenseSheetStore.getState().isOpen).toBe(true);
    expect(useExpenseSheetStore.getState().request).toEqual({
      mode: "edit",
      transaction,
    });
  });

  it("close() fecha o sheet", () => {
    act(() => {
      useExpenseSheetStore.getState().openEdit(buildTransaction());
    });
    act(() => {
      useExpenseSheetStore.getState().close();
    });
    expect(useExpenseSheetStore.getState().isOpen).toBe(false);
    expect(useExpenseSheetStore.getState().request).toEqual({ mode: "create" });
  });

  it("resetExpenseSheetStore() volta ao estado fechado", () => {
    act(() => {
      useExpenseSheetStore.getState().open();
    });
    resetExpenseSheetStore();
    expect(useExpenseSheetStore.getState().isOpen).toBe(false);
  });
});
