import { fireEvent, render } from "@testing-library/react-native";

import { TestProviders } from "@/shared/testing/test-providers";

import { GoalDetailScreen } from "@/features/goals/screens/goal-detail-screen";
import type { GoalDetailScreenController } from "@/features/goals/hooks/use-goal-detail-screen-controller";
import type { GoalProgressView } from "@/features/goals/services/goal-progress-calculator";

const mockHandleSimulate = jest.fn();
const mockHandleBack = jest.fn();

let mockController: Partial<GoalDetailScreenController> = {};

const buildGoal = (overrides: Partial<GoalProgressView> = {}): GoalProgressView => ({
  id: "g-1",
  title: "Reserva de emergencia",
  currentAmount: 6000,
  targetAmount: 24000,
  targetDate: "2026-12-31",
  status: "active",
  progress: 25,
  remaining: 18000,
  isCompleted: false,
  ...overrides,
});

jest.mock("@/features/goals/hooks/use-goal-detail-screen-controller", () => ({
  useGoalDetailScreenController: () => ({
    goalId: "g-1",
    goalsQuery: { isLoading: false } as never,
    goal: buildGoal(),
    targetDateLabel: "31 de dez. de 2026",
    notFound: false,
    handleSimulate: mockHandleSimulate,
    handleBack: mockHandleBack,
    ...mockController,
  }),
}));

jest.mock("@/features/goals/components/goal-plan-card", () => ({
  GoalPlanCard: () => null,
}));
jest.mock("@/features/goals/components/goal-projection-card", () => ({
  GoalProjectionCard: () => null,
}));
jest.mock("@/features/insights/components/ai-insight-surface", () => ({
  AiInsightSurface: () => null,
}));

const renderScreen = () =>
  render(
    <TestProviders>
      <GoalDetailScreen />
    </TestProviders>,
  );

beforeEach(() => {
  jest.clearAllMocks();
  mockController = {};
});

describe("GoalDetailScreen", () => {
  it("exibe titulo, progresso e resumo da meta", () => {
    const { getByText, getAllByText } = renderScreen();
    expect(getByText("Reserva de emergencia")).toBeTruthy();
    expect(getByText("25%")).toBeTruthy();
    expect(getByText("31 de dez. de 2026")).toBeTruthy();
    expect(getAllByText(/R\$/).length).toBeGreaterThan(0);
  });

  it("navega para o simulador ao tocar em simular", () => {
    const { getByText } = renderScreen();
    fireEvent.press(getByText("Simular cenarios"));
    expect(mockHandleSimulate).toHaveBeenCalled();
  });

  it("volta para a lista ao tocar em voltar", () => {
    const { getByText } = renderScreen();
    fireEvent.press(getByText("Voltar para metas"));
    expect(mockHandleBack).toHaveBeenCalled();
  });

  it("mostra empty state quando a meta nao existe", () => {
    mockController = { goal: null, notFound: true };
    const { getByText } = renderScreen();
    expect(getByText("Meta nao encontrada")).toBeTruthy();
  });

  it("mostra skeleton enquanto carrega sem meta", () => {
    mockController = {
      goal: null,
      notFound: false,
      goalsQuery: { isLoading: true } as never,
    };
    const { queryByText } = renderScreen();
    expect(queryByText("Simular cenarios")).toBeNull();
  });
});
