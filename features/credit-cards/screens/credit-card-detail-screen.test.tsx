import { fireEvent, render } from "@testing-library/react-native";

import { TestProviders } from "@/shared/testing/test-providers";

import { CreditCardDetailScreen } from "@/features/credit-cards/screens/credit-card-detail-screen";
import type { CreditCardDetailScreenController } from "@/features/credit-cards/hooks/use-credit-card-detail-screen-controller";
import type { CreditCardDetailViewModel } from "@/features/credit-cards/model/credit-card-detail";
import { resolveCardGradient } from "@/shared/theme";

const mockHandleBack = jest.fn();
const mockHandleViewBill = jest.fn();
const mockHandleLaunchExpense = jest.fn();
const mockHandleBlockCard = jest.fn();
const mockHandleOpenSettings = jest.fn();
let mockController: Partial<CreditCardDetailScreenController> = {};

const mockCreditCard = {
  id: "cc-1",
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

const mockDetail: CreditCardDetailViewModel = {
  subtitle: "Inter · mastercard",
  gradient: resolveCardGradient({ id: "cc-1", bank: "Inter", name: "Inter padrão" }),
  currentBillTotal: 8144.01,
  limit: {
    usedPct: 33,
    limitAmount: 25000,
    availableAmount: 16855.99,
    currentBillTotal: 8144.01,
    tone: "primary",
  },
  evolution: [
    { label: "Jan", value: 100 },
    { label: "Jun", value: 8144.01 },
  ],
  topCategories: [
    {
      tagId: "tag-compras",
      name: "Compras",
      color: "#9B5DE5",
      total: 3486.55,
      count: 2,
      items: [],
    },
  ],
  recentTransactions: [
    {
      id: "tx-1",
      title: "Renner",
      amount: 938.57,
      purchaseDate: "2026-06-25",
      tagId: "tag-compras",
      creditCardId: "cc-1",
      billMonth: "2026-06",
      isInstallment: false,
      installmentCount: null,
      installmentGroupId: null,
      status: "paid",
    },
  ],
};

jest.mock("@/features/credit-cards/hooks/use-credit-card-detail-screen-controller", () => ({
  useCreditCardDetailScreenController: (): CreditCardDetailScreenController =>
    ({
      creditCardId: "cc-1",
      creditCardsQuery: { isLoading: false } as never,
      creditCard: mockCreditCard,
      hasCycleConfig: true,
      utilizationQuery: { data: null } as never,
      tagsQuery: { data: null } as never,
      transactionsQuery: { data: null } as never,
      notFound: false,
      detail: mockDetail,
      handleViewBill: mockHandleViewBill,
      handleBack: mockHandleBack,
      handleLaunchExpense: mockHandleLaunchExpense,
      handleBlockCard: mockHandleBlockCard,
      handleOpenSettings: mockHandleOpenSettings,
      ...mockController,
    }) as CreditCardDetailScreenController,
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
  it("exibe nome, subtitulo e secoes principais", () => {
    const { getAllByText, getByText } = renderScreen();
    // O nome aparece na AppBar e na face do cartão.
    expect(getAllByText("Inter padrão").length).toBeGreaterThanOrEqual(1);
    expect(getByText("Inter · mastercard")).toBeTruthy();
    expect(getByText("Top categorias")).toBeTruthy();
    expect(getByText("Lançamentos recentes")).toBeTruthy();
  });

  it("renderiza a linha do bloco de limite", () => {
    const { getByText } = renderScreen();
    expect(getByText("Limite total")).toBeTruthy();
    expect(getByText("Disponível")).toBeTruthy();
    expect(getByText("Fatura atual")).toBeTruthy();
  });

  it("renderiza as 4 acoes rapidas", () => {
    const { getByTestId } = renderScreen();
    expect(getByTestId("card-quick-action-launch")).toBeTruthy();
    expect(getByTestId("card-quick-action-invoice")).toBeTruthy();
    expect(getByTestId("card-quick-action-block")).toBeTruthy();
    expect(getByTestId("card-quick-action-settings")).toBeTruthy();
  });

  it("Lançar abre o sheet de despesa", () => {
    const { getByTestId } = renderScreen();
    fireEvent.press(getByTestId("card-quick-action-launch"));
    expect(mockHandleLaunchExpense).toHaveBeenCalled();
  });

  it("Bloquear e Ajustes chamam os placeholders", () => {
    const { getByTestId } = renderScreen();
    fireEvent.press(getByTestId("card-quick-action-block"));
    fireEvent.press(getByTestId("card-quick-action-settings"));
    expect(mockHandleBlockCard).toHaveBeenCalled();
    expect(mockHandleOpenSettings).toHaveBeenCalled();
  });

  it("CTA fixo navega para a fatura completa", () => {
    const { getByTestId } = renderScreen();
    fireEvent.press(getByTestId("card-detail-cta"));
    expect(mockHandleViewBill).toHaveBeenCalled();
  });

  it("volta ao tocar em voltar", () => {
    const { getByTestId } = renderScreen();
    fireEvent.press(getByTestId("card-app-bar-back"));
    expect(mockHandleBack).toHaveBeenCalled();
  });

  it("mostra empty state quando o cartao nao existe", () => {
    mockController = { creditCard: null, notFound: true, detail: null };
    const { getByText } = renderScreen();
    expect(getByText("Cartão não encontrado")).toBeTruthy();
  });
});
