import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import { ExpenseSheetHost } from "@/features/credit-cards/components/expense-sheet/expense-sheet-host";
import type {
  ExpenseFormController,
  ExpenseSubmitResult,
} from "@/features/credit-cards/hooks/use-expense-form";
import type { TransactionRecord } from "@/features/transactions/contracts";
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
const mockUseExpenseForm = jest.fn((_request: unknown) => mockController);

const buildTransaction = (
  override: Partial<TransactionRecord> = {},
): TransactionRecord => ({
  id: "tx-1",
  title: "Mercado",
  amount: "50.00",
  type: "expense",
  dueDate: "2026-06-20",
  startDate: null,
  endDate: null,
  description: null,
  observation: null,
  isRecurring: false,
  isInstallment: false,
  installmentCount: null,
  recurrenceInterval: 1,
  recurrenceUnit: "month",
  tagId: null,
  accountId: null,
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

const mockController: ExpenseFormController = {
  cards: [],
  tags: [],
  accounts: [],
  title: "",
  amountText: "50.00",
  amount: 50,
  formMode: "create",
  purchaseDate: "2026-06-20",
  creditCardId: null,
  tagId: null,
  accountId: null,
  status: "pending",
  mode: "avista",
  installments: 3,
  hasDownPayment: false,
  downPaymentText: "",
  description: "",
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
  setDescription: jest.fn(),
  submit: submitMock,
  reset: resetMock,
};

jest.mock("@/features/credit-cards/hooks/use-expense-form", () => ({
  useExpenseForm: (request: unknown) => mockUseExpenseForm(request),
}));

describe("ExpenseSheetHost", () => {
  beforeEach(() => {
    resetExpenseSheetStore();
    submitMock.mockReset();
    resetMock.mockReset();
    mockUseExpenseForm.mockClear();
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

  it("passa o request de edição do store para o formulário", async () => {
    const transaction = buildTransaction();
    render(
      <TestProviders>
        <ExpenseSheetHost />
      </TestProviders>,
    );

    act(() => {
      useExpenseSheetStore.getState().openEdit(transaction);
    });

    await waitFor(() => {
      expect(mockUseExpenseForm).toHaveBeenLastCalledWith({
        mode: "edit",
        transaction,
      });
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
