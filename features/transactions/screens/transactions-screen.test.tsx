/* eslint-disable @typescript-eslint/no-require-imports */
import { fireEvent, render } from "@testing-library/react-native";

import { TestProviders } from "@/shared/testing/test-providers";

import { TransactionsScreen } from "@/features/transactions/screens/transactions-screen";
import type { TransactionsFeedController } from "@/features/transactions/hooks/use-transactions-feed-controller";
import type { TransactionFeedItem } from "@/features/transactions/model/transactions-feed";
import type { TransactionViewModel } from "@/features/transactions/hooks/use-transactions-screen-controller";

const mockSetViewMode = jest.fn();
const mockToggleCalendar = jest.fn();
const mockHandleOpenEdit = jest.fn();
const mockPush = jest.fn();

let mockOverrides: Partial<TransactionsFeedController> = {};

const feedItem: TransactionFeedItem = {
  id: "tx-1",
  title: "Impostos",
  description: "Impostos do salário gringo",
  amount: 2000,
  type: "expense",
  status: "pending",
  isRecurring: false,
  isInstallment: false,
  categoryName: "Impostos",
  categoryColor: "#E5484D",
  categoryIcon: "tax",
  relativeDate: "em 9 dias",
  dateDisplay: "em 9 dias",
  signedDisplay: "− R$ 2.000,00",
  percentOfFlow: 10,
};

const viewModel: TransactionViewModel = {
  id: "tx-1",
  title: "Impostos",
  amount: "2000.00",
  type: "expense",
  dueDate: "2026-06-29",
  status: "pending",
  description: "Impostos do salário gringo",
  isRecurring: false,
  isInstallment: false,
  installmentCount: null,
  installmentGroupId: null,
  installmentNumber: null,
};

const mockBaseController: TransactionsFeedController = {
  transactionsQuery: {
    data: { transactions: [{ ...viewModel, tagId: null }], pagination: { total: 1 } },
    isPending: false,
    isError: false,
    isSuccess: true,
  } as never,
  transactions: [viewModel],
  total: 1,
  monthBalance: 7769.07,
  hasActiveFilters: false,
  typeFilter: "all",
  setTypeFilter: jest.fn(),
  statusFilter: "all",
  setStatusFilter: jest.fn(),
  tagFilter: "all",
  setTagFilter: jest.fn(),
  periodLabel: "Junho de 2026",
  goToPreviousMonth: jest.fn(),
  goToNextMonth: jest.fn(),
  resetToCurrentMonth: jest.fn(),
  clearFilters: jest.fn(),
  installmentGroupFilter: null,
  formMode: { kind: "closed" },
  isSubmitting: false,
  submitError: null,
  deletingTransactionId: null,
  duplicatingTransactionId: null,
  payingTransactionId: null,
  handleOpenCreate: jest.fn(),
  handleOpenEdit: mockHandleOpenEdit,
  handleCloseForm: jest.fn(),
  handleSubmit: jest.fn(),
  handleDelete: jest.fn(),
  handleMarkPaid: jest.fn(),
  handleDuplicate: jest.fn(),
  handleShowInstallmentGroup: jest.fn(),
  handleClearInstallmentGroupFilter: jest.fn(),
  dismissSubmitError: jest.fn(),
  viewMode: "facil",
  setViewMode: mockSetViewMode,
  calendarActive: false,
  toggleCalendar: mockToggleCalendar,
  heroKpis: { income: 27675.37, expense: 19906.3, result: 7769.07, count: 10 },
  categoryBars: [{ tagId: "t1", name: "Cartão", color: "#FF8A3D", total: 11000 }],
  feedItems: [feedItem],
};

jest.mock("@/features/transactions/hooks/use-transactions-feed-controller", () => ({
  useTransactionsFeedController: (): TransactionsFeedController => ({
    ...mockBaseController,
    ...mockOverrides,
  }),
}));

jest.mock("@/features/insights/components/ai-insight-surface", () => ({
  AiInsightSurface: (): null => null,
}));

jest.mock("@/features/transactions/hooks/use-transactions-export", () => ({
  useTransactionsExport: () => ({
    exportNow: jest.fn(),
    isExporting: false,
    error: null,
    dismissError: jest.fn(),
  }),
}));

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock("react-native-gesture-handler/ReanimatedSwipeable", () => {
  const ReactInner = require("react");
  const { View } = require("react-native");
  const Swipeable = ({ children }: { readonly children: React.ReactNode }): React.ReactNode =>
    ReactInner.createElement(View, null, children);
  return { __esModule: true, default: Swipeable };
});

const renderScreen = () =>
  render(
    <TestProviders>
      <TransactionsScreen />
    </TestProviders>,
  );

beforeEach(() => {
  jest.clearAllMocks();
  mockOverrides = {};
});

describe("TransactionsScreen", () => {
  it("renderiza o herói com título, período e resultado", () => {
    const { getByText, getByTestId } = renderScreen();
    expect(getByText("Transações")).toBeTruthy();
    expect(getByText("Junho de 2026 · 10 lançamentos")).toBeTruthy();
    expect(getByTestId("tx-hero-result")).toBeTruthy();
  });

  it("mostra o segmented Fácil/Analítico e troca de modo", () => {
    const { getByTestId } = renderScreen();
    fireEvent.press(getByTestId("tx-mode-toggle-analitico"));
    expect(mockSetViewMode).toHaveBeenCalledWith("analitico");
  });

  it("no modo Analítico mostra o painel de categorias acima do feed", () => {
    mockOverrides = { viewMode: "analitico" };
    const { getByTestId, getByText } = renderScreen();
    expect(getByTestId("tx-category-breakdown")).toBeTruthy();
    expect(getByText("Gastos por categoria")).toBeTruthy();
  });

  it("renderiza os cards do feed e abre as ações ao tocar", () => {
    const { getByTestId, queryByTestId } = renderScreen();
    expect(getByTestId("tx-card-tx-1")).toBeTruthy();
    // O action sheet só existe após o toque no card.
    expect(queryByTestId("transaction-action-sheet")).toBeNull();
    fireEvent.press(getByTestId("tx-card-tx-1"));
    expect(getByTestId("transaction-action-sheet")).toBeTruthy();
    expect(getByTestId("action-delete")).toBeTruthy();
  });

  it("alterna o calendário pelo botão do herói", () => {
    const { getByTestId } = renderScreen();
    fireEvent.press(getByTestId("tx-hero-calendar-toggle"));
    expect(mockToggleCalendar).toHaveBeenCalled();
  });

  it("renderiza o calendário quando a visão de calendário está ativa", () => {
    mockOverrides = { calendarActive: true };
    const { queryByTestId } = renderScreen();
    // O feed não é renderizado na visão de calendário.
    expect(queryByTestId("transactions-flashlist")).toBeNull();
  });

  it("navega para a lixeira pelo botão de ações", () => {
    const { getByTestId } = renderScreen();
    fireEvent.press(getByTestId("transactions-trash-button"));
    expect(mockPush).toHaveBeenCalledWith("/lixeira-transacoes");
  });

  it("renderiza o formulário existente quando o modo não está fechado", () => {
    mockOverrides = { formMode: { kind: "create" } };
    const { queryByTestId } = renderScreen();
    expect(queryByTestId("transactions-screen")).toBeNull();
  });
});
