import { fireEvent, render } from "@testing-library/react-native";

import { TestProviders } from "@/shared/testing/test-providers";

import { CreditCardsScreen } from "@/features/credit-cards/screens/credit-cards-screen";
import type { CardsHomeController } from "@/features/credit-cards/hooks/use-cards-home-controller";
import type { CreditCardsScreenController } from "@/features/credit-cards/hooks/use-credit-cards-screen-controller";
import type { StatementViewModel } from "@/features/credit-cards/model/credit-card-statement";
import type { AnalyticsViewModel } from "@/features/credit-cards/model/credit-card-analytics";
import { transactionFixture } from "@/features/transactions/mocks";

const mockSetView = jest.fn();
const mockSelectCard = jest.fn();
const mockSelectMonth = jest.fn();
const mockHandleOpenCreate = jest.fn();

let mockHomeOverrides: Partial<CardsHomeController> = {};
let mockCrudOverrides: Partial<CreditCardsScreenController> = {};

const mockCard = {
  id: "card-1",
  name: "Inter Mastercard",
  brand: "mastercard" as const,
  limitAmount: 5000,
  closingDay: 10,
  dueDay: 17,
  lastFourDigits: "1234",
  bank: "Inter",
  description: null,
  benefits: [],
  validityDate: null,
  createdAt: null,
  updatedAt: null,
};

const mockFaturas: StatementViewModel = {
  month: "2026-06",
  monthLabel: "junho de 2026",
  cardId: null,
  total: 8144.01,
  itemCount: 12,
  status: { label: "Aberta", tone: "open" },
  closingDate: "2026-06-30",
  dueDate: "2026-07-10",
  categories: [
    {
      tagId: "t1",
      name: "Compras",
      color: "#9B5DE5",
      total: 3486.55,
      count: 4,
      items: [
        {
          id: "tx-1",
          title: "Renner",
          amount: 938.57,
          purchaseDate: "2026-06-25",
          tagId: "t1",
          creditCardId: "card-1",
          billMonth: "2026-06",
          isInstallment: false,
          installmentCount: null,
          installmentGroupId: null,
          status: "posted",
          transaction: {
            ...transactionFixture,
            id: "tx-1",
            title: "Renner",
            amount: "938.57",
            dueDate: "2026-06-25",
            tagId: "t1",
            creditCardId: "card-1",
            status: "pending",
          },
        },
      ],
    },
  ],
  monthlyTrend: [],
  utilizationPct: 42,
  limitAmount: 5000,
  railTotals: [{ cardId: "card-1", name: "Inter Mastercard", total: 8144.01 }],
  allCardsTotal: 8144.01,
};

const mockAnalitico: AnalyticsViewModel = {
  month: "2026-06",
  cardId: null,
  kpis: {
    billTotal: 8144.01,
    variation: { delta: 200, pct: 2.5 },
    topCategory: { name: "Compras", color: "#9B5DE5", total: 3486.55 },
    limitUsedPct: 42,
  },
  monthlySeries: {
    months: ["2026-05", "2026-06"],
    series: [{ cardId: "card-1", name: "Inter", values: [7900, 8144.01] }],
  },
  categories: mockFaturas.categories,
  cardTotals: [{ cardId: "card-1", name: "Inter Mastercard", total: 8144.01 }],
  topTransactions: [],
  topRows: [
    {
      id: "tx-1",
      title: "Renner",
      amount: 938.57,
      isInstallment: false,
      installmentCount: null,
      purchaseDate: "2026-06-25",
      categoryName: "Compras",
      categoryColor: "#9B5DE5",
      cardName: "Inter Mastercard",
    },
  ],
};

const mockBaseHome: CardsHomeController = {
  cardsQuery: { data: { creditCards: [mockCard] }, isLoading: false, isError: false } as never,
  tagsQuery: {} as never,
  transactionsQuery: {} as never,
  utilizationQuery: {} as never,
  billQuery: {} as never,
  view: "faturas",
  selectedCardId: null,
  selectedMonth: "2026-06",
  months: [
    { month: "2026-05", shortLabel: "mai", label: "maio de 2026", isCurrent: false },
    { month: "2026-06", shortLabel: "jun", label: "junho de 2026", isCurrent: true },
  ],
  faturas: mockFaturas,
  analitico: mockAnalitico,
  setView: mockSetView,
  selectCard: mockSelectCard,
  selectMonth: mockSelectMonth,
  goPreviousMonth: jest.fn(),
  goNextMonth: jest.fn(),
};

jest.mock("@/features/credit-cards/hooks/use-cards-home-controller", () => ({
  useCardsHomeController: (): CardsHomeController => ({
    ...mockBaseHome,
    ...mockHomeOverrides,
  }),
}));

jest.mock(
  "@/features/credit-cards/hooks/use-credit-cards-screen-controller",
  () => ({
    useCreditCardsScreenController: (): CreditCardsScreenController => ({
      creditCardsQuery: {} as never,
      creditCards: [mockCard],
      formMode: { kind: "closed" },
      isSubmitting: false,
      submitError: null,
      deletingCreditCardId: null,
      handleOpenCreate: mockHandleOpenCreate,
      handleOpenEdit: jest.fn(),
      handleCloseForm: jest.fn(),
      handleSubmit: jest.fn(),
      handleDelete: jest.fn(),
      dismissSubmitError: jest.fn(),
      ...mockCrudOverrides,
    }),
  }),
);

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

const renderScreen = () =>
  render(
    <TestProviders>
      <CreditCardsScreen />
    </TestProviders>,
  );

beforeEach(() => {
  jest.clearAllMocks();
  mockHomeOverrides = {};
  mockCrudOverrides = {};
});

describe("CreditCardsScreen", () => {
  it("exibe o hero com título e subtítulo de cartões/limite", () => {
    const { getByText } = renderScreen();
    expect(getByText("Cartões")).toBeTruthy();
    expect(getByText(/1 cartões · limite/u)).toBeTruthy();
  });

  it("renderiza o carrossel com o card agregado e a face do cartão", () => {
    const { getByTestId } = renderScreen();
    expect(getByTestId("card-carousel-all")).toBeTruthy();
    expect(getByTestId("card-carousel-card-card-1")).toBeTruthy();
  });

  it("mostra a visão Faturas por padrão (resumo da fatura)", () => {
    const { getByText } = renderScreen();
    expect(getByText("Fatura de junho de 2026")).toBeTruthy();
    expect(getByText("Onde foi gasto")).toBeTruthy();
  });

  it("troca para a visão Analítico ao tocar no segmento", () => {
    const { getByTestId } = renderScreen();
    fireEvent.press(getByTestId("cards-segmented-analitico"));
    expect(mockSetView).toHaveBeenCalledWith("analitico");
  });

  it("renderiza a visão Analítico quando ativa", () => {
    mockHomeOverrides = { view: "analitico" };
    const { getByText } = renderScreen();
    expect(getByText("Gastos por categoria")).toBeTruthy();
    expect(getByText("Maiores lançamentos")).toBeTruthy();
  });

  it("abre o formulário de criação ao tocar em adicionar cartão", () => {
    const { getByTestId } = renderScreen();
    fireEvent.press(getByTestId("cards-add-button"));
    expect(mockHandleOpenCreate).toHaveBeenCalled();
  });

  it("renderiza o formulário existente quando o modo não está fechado", () => {
    mockCrudOverrides = { formMode: { kind: "create" } };
    const { queryByTestId } = renderScreen();
    expect(queryByTestId("credit-cards-screen")).toBeNull();
  });

  it("expõe âncoras de onboarding (testIDs do tour)", () => {
    const { getByTestId } = renderScreen();
    expect(getByTestId("tour-cards")).toBeTruthy();
    expect(getByTestId("tour-views")).toBeTruthy();
    expect(getByTestId("tour-months")).toBeTruthy();
    expect(getByTestId("tour-fatura")).toBeTruthy();
    expect(getByTestId("tour-theme")).toBeTruthy();
  });
});
