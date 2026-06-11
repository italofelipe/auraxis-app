import { fireEvent, render } from "@testing-library/react-native";

import { TestProviders } from "@/shared/testing/test-providers";

import { CreditCardDetailScreen } from "@/features/credit-cards/screens/credit-card-detail-screen";
import type { CreditCardDetailScreenController } from "@/features/credit-cards/hooks/use-credit-card-detail-screen-controller";

const mockHandleBack = jest.fn();
const mockHandleViewBill = jest.fn();
let mockController: Partial<CreditCardDetailScreenController> = {};

const creditCard = {
  id: "cc-1",
  name: "Nubank",
  brand: "mastercard" as const,
  limitAmount: 5000,
  closingDay: 10,
  dueDay: 17,
  lastFourDigits: "1234",
  bank: "Nu",
  description: null,
  benefits: [],
  validityDate: null,
  createdAt: null,
  updatedAt: null,
};

const utilization = {
  cycle: { startDate: "2026-06-01", endDate: "2026-06-30", dueDate: "2026-07-10", status: "open" },
  committedAmount: 2000,
  availableAmount: 3000,
  limitAmount: 5000,
  utilizationPct: 40,
};

jest.mock("@/features/credit-cards/hooks/use-credit-card-detail-screen-controller", () => ({
  useCreditCardDetailScreenController: () => ({
    creditCardId: "cc-1",
    creditCardsQuery: { isLoading: false } as never,
    creditCard,
    hasCycleConfig: true,
    utilizationQuery: { data: utilization, isLoading: false, isError: false } as never,
    notFound: false,
    handleViewBill: mockHandleViewBill,
    handleBack: mockHandleBack,
    ...mockController,
  }),
}));

const renderScreen = () =>
  render(
    <TestProviders>
      <CreditCardDetailScreen />
    </TestProviders>,
  );

beforeEach(() => {
  jest.clearAllMocks();
  mockController = {};
});

describe("CreditCardDetailScreen", () => {
  it("exibe nome, banco, marca, limite e ciclo", () => {
    const { getByText } = renderScreen();
    expect(getByText("Nubank")).toBeTruthy();
    expect(getByText("mastercard")).toBeTruthy();
    expect(getByText("final 1234")).toBeTruthy();
  });

  it("mostra a utilizacao quando ciclo configurado", () => {
    const { getByText } = renderScreen();
    expect(getByText("40.0%")).toBeTruthy();
  });

  it("navega para a fatura", () => {
    const { getByText } = renderScreen();
    fireEvent.press(getByText("Ver fatura"));
    expect(mockHandleViewBill).toHaveBeenCalled();
  });

  it("mostra alerta de ciclo nao configurado e desabilita fatura", () => {
    mockController = { hasCycleConfig: false };
    const { getByText } = renderScreen();
    expect(getByText("Ciclo nao configurado")).toBeTruthy();
  });

  it("mostra empty state quando o cartao nao existe", () => {
    mockController = { creditCard: null, notFound: true };
    const { getByText } = renderScreen();
    expect(getByText("Cartao nao encontrado")).toBeTruthy();
  });

  it("volta ao tocar em voltar", () => {
    const { getByText } = renderScreen();
    fireEvent.press(getByText("Voltar"));
    expect(mockHandleBack).toHaveBeenCalled();
  });
});
