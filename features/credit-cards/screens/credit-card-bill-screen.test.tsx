import { fireEvent, render } from "@testing-library/react-native";

import { TestProviders } from "@/shared/testing/test-providers";

import { CreditCardBillScreen } from "@/features/credit-cards/screens/credit-card-bill-screen";
import type { CreditCardBillScreenController } from "@/features/credit-cards/hooks/use-credit-card-bill-screen-controller";
import type { CreditCardInvoiceViewModel } from "@/features/credit-cards/model/credit-card-invoice";
import { resolveCardGradient } from "@/shared/theme";

const mockHandleBack = jest.fn();
const mockHandlePreviousMonth = jest.fn();
const mockHandleNextMonth = jest.fn();
const mockHandlePayBill = jest.fn();
let mockController: Partial<CreditCardBillScreenController> = {};

const mockCreditCard = {
  id: "card-1",
  name: "Inter padrão",
  brand: "mastercard" as const,
  limitAmount: 25000,
  closingDay: 28,
  dueDay: 10,
  lastFourDigits: "4000",
  bank: "Inter",
  description: null,
  benefits: [],
  validityDate: null,
  createdAt: null,
  updatedAt: null,
};

const mockInvoice: CreditCardInvoiceViewModel = {
  gradient: resolveCardGradient({ id: "card-1", bank: "Inter", name: "Inter padrão" }),
  total: 8144.01,
  status: { label: "Aberta", tone: "open" },
  dueDateLabel: "10/07",
  itemCount: 3,
  categoryBreakdown: [
    { id: "tag-compras", label: "Compras", color: "#9B5DE5", value: 3486.55 },
  ],
  groupedByCategory: [
    {
      tagId: "tag-compras",
      name: "Compras",
      color: "#9B5DE5",
      total: 3486.55,
      count: 1,
      items: [
        {
          id: "tx-1",
          title: "Renner",
          amount: 938.57,
          purchaseDate: "2026-06-25",
          tagId: "tag-compras",
          creditCardId: "card-1",
          billMonth: "2026-06",
          isInstallment: false,
          installmentCount: null,
          installmentGroupId: null,
          status: "paid",
        },
      ],
    },
  ],
};

jest.mock("@/features/credit-cards/hooks/use-credit-card-bill-screen-controller", () => ({
  useCreditCardBillScreenController: (): CreditCardBillScreenController =>
    ({
      creditCardId: "card-1",
      creditCard: mockCreditCard,
      selectedMonth: "2026-06",
      selectedMonthLabel: "junho de 2026",
      bill: null,
      billQuery: { isLoading: false } as never,
      creditCardsQuery: { isLoading: false } as never,
      tagsQuery: { data: null } as never,
      transactionsQuery: { data: null } as never,
      groupedTransactions: [],
      cycleLabel: null,
      invoice: mockInvoice,
      handlePreviousMonth: mockHandlePreviousMonth,
      handleNextMonth: mockHandleNextMonth,
      handleBack: mockHandleBack,
      handlePayBill: mockHandlePayBill,
      ...mockController,
    }) as CreditCardBillScreenController,
}));

const renderScreen = () =>
  render(
    <TestProviders>
      <CreditCardBillScreen />
    </TestProviders>,
  );

beforeEach(() => {
  jest.clearAllMocks();
  mockController = {};
});

describe("CreditCardBillScreen", () => {
  it("exibe o cabecalho com Fatura e nome do cartao", () => {
    const { getByText } = renderScreen();
    expect(getByText("Fatura")).toBeTruthy();
    expect(getByText("Inter padrão")).toBeTruthy();
  });

  it("renderiza o hero com mes, total e status", () => {
    const { getByText } = renderScreen();
    expect(getByText("junho de 2026")).toBeTruthy();
    expect(getByText("Aberta")).toBeTruthy();
    expect(getByText(/vence dia 10\/07/u)).toBeTruthy();
  });

  it("renderiza as secoes onde foi gasto e itens da fatura", () => {
    const { getByText } = renderScreen();
    expect(getByText("Onde foi gasto")).toBeTruthy();
    expect(getByText("Itens da fatura")).toBeTruthy();
    expect(getByText("Renner")).toBeTruthy();
  });

  it("navega entre meses pelo hero", () => {
    const { getByTestId } = renderScreen();
    fireEvent.press(getByTestId("invoice-hero-prev"));
    expect(mockHandlePreviousMonth).toHaveBeenCalled();
    fireEvent.press(getByTestId("invoice-hero-next"));
    expect(mockHandleNextMonth).toHaveBeenCalled();
  });

  it("CTA pagar fatura chama o placeholder", () => {
    const { getByTestId } = renderScreen();
    fireEvent.press(getByTestId("invoice-pay-cta"));
    expect(mockHandlePayBill).toHaveBeenCalled();
  });

  it("volta ao tocar em voltar", () => {
    const { getByTestId } = renderScreen();
    fireEvent.press(getByTestId("card-app-bar-back"));
    expect(mockHandleBack).toHaveBeenCalled();
  });

  it("mostra empty state quando nao ha cartao/fatura", () => {
    mockController = { creditCard: null, invoice: null };
    const { getByText } = renderScreen();
    expect(getByText("Fatura indisponível")).toBeTruthy();
  });
});
