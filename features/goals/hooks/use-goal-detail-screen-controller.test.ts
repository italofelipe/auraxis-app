import { renderHook } from "@testing-library/react-native";

import { useGoalsQuery } from "@/features/goals/hooks/use-goals-query";
import { useGoalDetailScreenController } from "@/features/goals/hooks/use-goal-detail-screen-controller";

const mockPush = jest.fn();
const mockBack = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush, back: mockBack }),
  useLocalSearchParams: () => ({ id: "goal-1" }),
}));

jest.mock("@/features/goals/hooks/use-goals-query", () => ({
  useGoalsQuery: jest.fn(),
}));

const mockedUseGoalsQuery = jest.mocked(useGoalsQuery);

const buildGoal = (overrides: Record<string, unknown> = {}) => ({
  id: "goal-1",
  title: "Reserva de emergencia",
  currentAmount: 6000,
  targetAmount: 24000,
  targetDate: "2026-12-31",
  status: "active",
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
  mockedUseGoalsQuery.mockReturnValue({
    data: { goals: [buildGoal()] },
    isLoading: false,
  } as never);
});

describe("useGoalDetailScreenController", () => {
  it("decora a meta selecionada com progresso e restante", () => {
    const { result } = renderHook(() =>
      useGoalDetailScreenController({ goalId: "goal-1" }),
    );

    expect(result.current.goal).toEqual(
      expect.objectContaining({
        id: "goal-1",
        progress: 25,
        remaining: 18000,
        isCompleted: false,
      }),
    );
    expect(result.current.goalId).toBe("goal-1");
  });

  it("formata o prazo em pt-BR", () => {
    const { result } = renderHook(() =>
      useGoalDetailScreenController({ goalId: "goal-1" }),
    );
    expect(result.current.targetDateLabel).toContain("2026");
  });

  it("usa 'Sem prazo' quando a meta nao tem data alvo", () => {
    mockedUseGoalsQuery.mockReturnValue({
      data: { goals: [buildGoal({ targetDate: null })] },
      isLoading: false,
    } as never);

    const { result } = renderHook(() =>
      useGoalDetailScreenController({ goalId: "goal-1" }),
    );
    expect(result.current.targetDateLabel).toBe("Sem prazo");
  });

  it("retorna goal null quando a meta nao existe na lista", () => {
    const { result } = renderHook(() =>
      useGoalDetailScreenController({ goalId: "missing" }),
    );
    expect(result.current.goal).toBeNull();
    expect(result.current.notFound).toBe(true);
  });

  it("le o goalId do parametro de rota quando nao injetado", () => {
    const { result } = renderHook(() => useGoalDetailScreenController());
    expect(result.current.goalId).toBe("goal-1");
  });

  it("handleSimulate navega para o simulador da meta", () => {
    const { result } = renderHook(() =>
      useGoalDetailScreenController({ goalId: "goal-1" }),
    );
    result.current.handleSimulate();
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/metas/[id]/simular",
      params: { id: "goal-1" },
    });
  });

  it("handleBack volta para a lista de metas", () => {
    const { result } = renderHook(() =>
      useGoalDetailScreenController({ goalId: "goal-1" }),
    );
    result.current.handleBack();
    expect(mockBack).toHaveBeenCalled();
  });
});
