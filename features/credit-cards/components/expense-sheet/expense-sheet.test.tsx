import { createRef } from "react";

import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import { act, fireEvent, render, screen } from "@testing-library/react-native";

import { ExpenseSheet } from "@/features/credit-cards/components/expense-sheet/expense-sheet";
import type { ExpenseFormController } from "@/features/credit-cards/hooks/use-expense-form";
import { TestProviders } from "@/shared/testing/test-providers";

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 20, left: 0, right: 0 }),
}));

const buildController = (
  overrides: Partial<ExpenseFormController> = {},
): ExpenseFormController => ({
  cards: [
    {
      id: "cc-1",
      name: "Inter",
      brand: "mastercard",
      limitAmount: 25000,
      closingDay: 5,
      dueDay: 10,
      lastFourDigits: "4000",
      bank: "Inter",
      description: null,
      benefits: [],
      validityDate: null,
      createdAt: null,
      updatedAt: null,
    },
  ],
  tags: [{ id: "t-food", name: "Alimentação", color: "#11A36B", icon: null }],
  accounts: [
    {
      id: "ac-1",
      name: "Conta corrente",
      accountType: "checking",
      institution: null,
      initialBalance: 0,
    },
  ],
  title: "",
  amountText: "120.00",
  amount: 120,
  purchaseDate: "2026-06-20",
  creditCardId: null,
  tagId: null,
  accountId: null,
  status: "pending",
  mode: "avista",
  installments: 3,
  hasDownPayment: false,
  downPaymentText: "",
  plan: { downPayment: 0, financed: 120, perInstallment: 40 },
  distribution: [
    { key: "full", label: "jul", sub: "à vista", value: 120, isEntry: false },
  ],
  faturaPreview: {
    hasCard: false,
    cardName: null,
    billLabel: null,
    closingDate: null,
    dueDate: null,
    limitAmount: null,
  },
  canSubmit: true,
  installmentsEnabled: true,
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
  submit: jest.fn(),
  reset: jest.fn(),
  ...overrides,
});

const renderSheet = (
  controller: ExpenseFormController,
  handlers: { onClose: () => void; onSubmit: () => void },
): React.RefObject<BottomSheetModal | null> => {
  const ref = createRef<BottomSheetModal>();
  render(
    <TestProviders>
      <ExpenseSheet
        ref={ref}
        controller={controller}
        onClose={handlers.onClose}
        onSubmit={handlers.onSubmit}
      />
    </TestProviders>,
  );
  act(() => {
    ref.current?.present();
  });
  return ref;
};

describe("ExpenseSheet", () => {
  it("renderiza título, seções e CTA quando apresentado", () => {
    renderSheet(buildController(), { onClose: jest.fn(), onSubmit: jest.fn() });

    expect(screen.getByText("Compra, fatura e impacto")).toBeTruthy();
    expect(screen.getAllByText("Lançar despesa").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByTestId("expense-amount-field")).toBeTruthy();
    expect(screen.getByTestId("expense-card-chips")).toBeTruthy();
    expect(screen.getByTestId("installment-section")).toBeTruthy();
    expect(screen.getByTestId("classification-section")).toBeTruthy();
    expect(screen.getByTestId("fatura-preview")).toBeTruthy();
    expect(screen.getByTestId("expense-sheet-submit")).toBeTruthy();
  });

  it("oculta a seção de parcelamento quando a flag está desligada", () => {
    renderSheet(buildController({ installmentsEnabled: false }), {
      onClose: jest.fn(),
      onSubmit: jest.fn(),
    });

    expect(screen.queryByTestId("installment-section")).toBeNull();
  });

  it("dispara onSubmit ao tocar no CTA habilitado", () => {
    const onSubmit = jest.fn();
    renderSheet(buildController({ canSubmit: true }), {
      onClose: jest.fn(),
      onSubmit,
    });

    fireEvent.press(screen.getByTestId("expense-sheet-submit"));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("dispara onClose ao tocar no botão fechar", () => {
    const onClose = jest.fn();
    renderSheet(buildController(), { onClose, onSubmit: jest.fn() });

    fireEvent.press(screen.getByTestId("expense-sheet-close"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("mostra os chips de distribuição no modo parcelado", () => {
    renderSheet(
      buildController({
        mode: "parcelado",
        distribution: [
          { key: "p0", label: "jul", sub: "1/3", value: 40, isEntry: false },
          { key: "p1", label: "ago", sub: "2/3", value: 40, isEntry: false },
        ],
      }),
      { onClose: jest.fn(), onSubmit: jest.fn() },
    );

    expect(screen.getByTestId("distribution-chip-p0")).toBeTruthy();
    expect(screen.getByTestId("distribution-chip-p1")).toBeTruthy();
    expect(screen.getByTestId("installment-down-payment-toggle")).toBeTruthy();
  });
});
