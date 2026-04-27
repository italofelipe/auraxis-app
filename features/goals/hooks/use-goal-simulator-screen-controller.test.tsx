import { act, renderHook } from "@testing-library/react-native";

import { useGoalSimulatorScreenController } from "@/features/goals/hooks/use-goal-simulator-screen-controller";
import { useSimulateGoalMutation } from "@/features/goals/hooks/use-goals-simulator-mutation";

jest.mock("@/features/goals/hooks/use-goals-simulator-mutation", () => ({
  useSimulateGoalMutation: jest.fn(),
}));

const mockedUseMutation = jest.mocked(useSimulateGoalMutation);

const buildMutationStub = () => ({
  mutateAsync: jest.fn().mockResolvedValue({
    monthlyContribution: 500,
    monthsToTarget: 24,
    recommendedSavingsRate: 0.1,
    projectedFinishDate: "2028-01-01",
    disclaimer: null,
  }),
  reset: jest.fn(),
  isPending: false,
  error: null,
});

let stub: ReturnType<typeof buildMutationStub>;

beforeEach(() => {
  stub = buildMutationStub();
  mockedUseMutation.mockReturnValue(stub as never);
});

describe("useGoalSimulatorScreenController", () => {
  it("estado inicial vazio", () => {
    const { result } = renderHook(() => useGoalSimulatorScreenController());
    expect(result.current.result).toBeNull();
    expect(result.current.submitError).toBeNull();
  });

  it("submit chama mutateAsync e armazena resultado", async () => {
    const { result } = renderHook(() => useGoalSimulatorScreenController());
    await act(async () => {
      await result.current.handleSubmit({
        targetAmount: 100000,
        currentAmount: 0,
        targetDate: null,
        monthlyIncome: null,
        monthlyExpenses: null,
        monthlyContribution: null,
      });
    });
    expect(stub.mutateAsync).toHaveBeenCalled();
    expect(result.current.result?.monthlyContribution).toBe(500);
  });

  it("captura submitError quando mutation falha", async () => {
    stub.mutateAsync.mockRejectedValueOnce(new Error("boom"));
    const { result } = renderHook(() => useGoalSimulatorScreenController());
    await act(async () => {
      await result.current.handleSubmit({
        targetAmount: 1,
        currentAmount: 0,
        targetDate: null,
        monthlyIncome: null,
        monthlyExpenses: null,
        monthlyContribution: null,
      });
    });
    expect(result.current.submitError).toBeInstanceOf(Error);
  });

  it("handleReset limpa estado e mutation", async () => {
    const { result } = renderHook(() => useGoalSimulatorScreenController());
    await act(async () => {
      await result.current.handleSubmit({
        targetAmount: 1,
        currentAmount: 0,
        targetDate: null,
        monthlyIncome: null,
        monthlyExpenses: null,
        monthlyContribution: null,
      });
    });
    act(() => {
      result.current.handleReset();
    });
    expect(result.current.result).toBeNull();
    expect(stub.reset).toHaveBeenCalled();
  });

  it("dismissSubmitError limpa apenas o erro", async () => {
    stub.mutateAsync.mockRejectedValueOnce(new Error("oops"));
    const { result } = renderHook(() => useGoalSimulatorScreenController());
    await act(async () => {
      await result.current.handleSubmit({
        targetAmount: 1,
        currentAmount: 0,
        targetDate: null,
        monthlyIncome: null,
        monthlyExpenses: null,
        monthlyContribution: null,
      });
    });
    act(() => {
      result.current.dismissSubmitError();
    });
    expect(result.current.submitError).toBeNull();
  });
});
