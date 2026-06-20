import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import { ExpenseSheetHost } from "@/features/credit-cards/components/expense-sheet/expense-sheet-host";
import type {
  ExpenseFormController,
  ExpenseSubmitResult,
} from "@/features/credit-cards/hooks/use-expense-form";
import { TestProviders } from "@/shared/testing/test-providers";
import {
  resetExpenseSheetStore,
  useExpenseSheetStore,
} from "@/stores/expense-sheet-store";

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 20, left: 0, right: 0 }),
}));

const submitMock = jest.fn<Promise<ExpenseSubmitResult>, []>();
const resetMock = jest.fn();

const mockController: ExpenseFormController = {
  cards: [],
  tags: [],
  accounts: [],
  title: "",
  amountText: "50.00",
  amount: 50,
  purchaseDate: "2026-06-20",
  creditCardId: null,
  tagId: null,
  accountId: null,
  status: "pending",
  mode: "avista",
  installments: 3,
  hasDownPayment: false,
  downPaymentText: "",
  plan: { downPayment: 0, financed: 50, perInstallment: 50 },
  distribution: [],
  faturaPreview: {
    hasCard: false,
    cardName: null,
    billLabel: null,
    closingDate: null,
    dueDate: null,
    limitAmount: null,
  },
  canSubmit: true,
  installmentsEnabled: false,
  isSubmitting: false,
  submitError: null,
  setTitle: jest.fn(),
  setAmountText: jest.fn(),
  setPurchaseDate: jest.fn(),
  selectCard: jest.fn(),
  selectTag: jest.fn(),
  selectAccount: jest.fn(),
  setStatus: jest.fn(),
  setMode: jest.fn(),
  setInstallments: jest.fn(),
  toggleDownPayment: jest.fn(),
  setDownPaymentText: jest.fn(),
  submit: submitMock,
  reset: resetMock,
};

jest.mock("@/features/credit-cards/hooks/use-expense-form", () => ({
  useExpenseForm: () => mockController,
}));

describe("ExpenseSheetHost", () => {
  beforeEach(() => {
    resetExpenseSheetStore();
    submitMock.mockReset();
    resetMock.mockReset();
    submitMock.mockResolvedValue({ created: 1, ok: true, error: null });
  });

  it("apresenta o sheet quando o store abre", async () => {
    render(
      <TestProviders>
        <ExpenseSheetHost />
      </TestProviders>,
    );

    expect(screen.queryByTestId("expense-sheet")).toBeNull();

    act(() => {
      useExpenseSheetStore.getState().open();
    });

    await waitFor(() => {
      expect(screen.getByTestId("expense-sheet")).toBeTruthy();
    });
  });

  it("no submit com sucesso fecha o store e reseta o formulário", async () => {
    render(
      <TestProviders>
        <ExpenseSheetHost />
      </TestProviders>,
    );

    act(() => {
      useExpenseSheetStore.getState().open();
    });
    await waitFor(() => screen.getByTestId("expense-sheet-submit"));

    await act(async () => {
      fireEvent.press(screen.getByTestId("expense-sheet-submit"));
    });

    await waitFor(() => {
      expect(submitMock).toHaveBeenCalledTimes(1);
      expect(resetMock).toHaveBeenCalledTimes(1);
      expect(useExpenseSheetStore.getState().isOpen).toBe(false);
    });
  });

  it("no submit com erro mantém o store aberto e não reseta", async () => {
    submitMock.mockResolvedValue({ created: 0, ok: false, error: new Error("x") });
    render(
      <TestProviders>
        <ExpenseSheetHost />
      </TestProviders>,
    );

    act(() => {
      useExpenseSheetStore.getState().open();
    });
    await waitFor(() => screen.getByTestId("expense-sheet-submit"));

    await act(async () => {
      fireEvent.press(screen.getByTestId("expense-sheet-submit"));
    });

    await waitFor(() => {
      expect(submitMock).toHaveBeenCalledTimes(1);
    });
    expect(resetMock).not.toHaveBeenCalled();
    expect(useExpenseSheetStore.getState().isOpen).toBe(true);
  });
});
