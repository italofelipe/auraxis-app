import { fireEvent, render } from "@testing-library/react-native";

import { TestProviders } from "@/shared/testing/test-providers";

import { BudgetDetailScreen } from "@/features/budgets/screens/budget-detail-screen";
import type { BudgetDetailScreenController } from "@/features/budgets/hooks/use-budget-detail-screen-controller";

const mockHandleBack = jest.fn();
let mockController: Partial<BudgetDetailScreenController> = {};

const budget = {
  id: "b-1",
  name: "Mercado",
  amount: "1000.00",
  spent: "850.00",
  remaining: "150.00",
  percentageUsed: 85,
  period: "monthly" as const,
  startDate: null,
  endDate: null,
  tagId: "tag-1",
  tagName: "Alimentacao",
  tagColor: "#fff",
  isActive: true,
  isOverBudget: false,
  createdAt: "2026-06-01T00:00:00Z",
  updatedAt: "2026-06-01T00:00:00Z",
};

const previewTx = [
  {
    id: "t-1",
    title: "Supermercado",
    amount: "120.00",
    type: "expense" as const,
    dueDate: "2026-06-05",
    status: "paid" as const,
  },
];

jest.mock("@/features/budgets/hooks/use-budget-detail-screen-controller", () => ({
  useBudgetDetailScreenController: () => ({
    budgetId: "b-1",
    budgetsQuery: { isLoading: false } as never,
    budget,
    usageLevel: "warning",
    notFound: false,
    transactionsQuery: { data: { transactions: previewTx }, isLoading: false, isError: false } as never,
    previewTransactions: previewTx,
    handleBack: mockHandleBack,
    ...mockController,
  }),
}));

const renderScreen = () =>
  render(
    <TestProviders>
      <BudgetDetailScreen />
    </TestProviders>,
  );

beforeEach(() => {
  jest.clearAllMocks();
  mockController = {};
});

describe("BudgetDetailScreen", () => {
  it("exibe nome, nivel de uso, montantes e tag", () => {
    const { getByText } = renderScreen();
    expect(getByText("Mercado")).toBeTruthy();
    expect(getByText("Atencao · 85.0%")).toBeTruthy();
    expect(getByText("Alimentacao")).toBeTruthy();
  });

  it("lista o preview de transacoes do periodo", () => {
    const { getByText } = renderScreen();
    expect(getByText("Supermercado")).toBeTruthy();
    expect(getByText("-120.00")).toBeTruthy();
  });

  it("volta ao tocar em voltar", () => {
    const { getByText } = renderScreen();
    fireEvent.press(getByText("Voltar"));
    expect(mockHandleBack).toHaveBeenCalled();
  });

  it("mostra empty state quando o orcamento nao existe", () => {
    mockController = { budget: null, notFound: true };
    const { getByText } = renderScreen();
    expect(getByText("Orcamento nao encontrado")).toBeTruthy();
  });
});
