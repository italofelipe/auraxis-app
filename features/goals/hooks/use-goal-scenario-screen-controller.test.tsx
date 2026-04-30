import { act, renderHook } from "@testing-library/react-native";

import {
  useGoalProjectionQuery,
  useGoalsQuery,
} from "@/features/goals/hooks/use-goals-query";
import { useUpdateGoalMutation } from "@/features/goals/hooks/use-goals-mutations";
import { useGoalScenarioScreenController } from "@/features/goals/hooks/use-goal-scenario-screen-controller";

const mockReplaceFn = jest.fn();
const mockBackFn = jest.fn();
const mockCanGoBackFn = jest.fn(() => true);
let mockedSearchParams: Record<string, string> = {};

jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: mockReplaceFn,
    back: mockBackFn,
    canGoBack: mockCanGoBackFn,
  }),
  useLocalSearchParams: () => mockedSearchParams,
}));

jest.mock("@/features/goals/hooks/use-goals-query", () => ({
  useGoalsQuery: jest.fn(),
  useGoalProjectionQuery: jest.fn(),
}));

jest.mock("@/features/goals/hooks/use-goals-mutations", () => ({
  useUpdateGoalMutation: jest.fn(),
}));

const mockedUseGoalsQuery = jest.mocked(useGoalsQuery);
const mockedUseGoalProjectionQuery = jest.mocked(useGoalProjectionQuery);
const mockedUseUpdate = jest.mocked(useUpdateGoalMutation);

const buildUpdateStub = () => ({
  mutate: jest.fn(),
  mutateAsync: jest.fn().mockResolvedValue(undefined),
  reset: jest.fn(),
  isPending: false,
  error: null,
});

let updateStub: ReturnType<typeof buildUpdateStub>;

const aGoal = {
  id: "g-1",
  title: "Reserva",
  currentAmount: 5000,
  targetAmount: 30_000,
  targetDate: null,
  status: "active",
};

const aProjection = {
  goalId: "g-1",
  projectedFinishDate: "2027-06-01",
  projectedAmountAtTarget: 30_000,
  assumptions: { annualReturnRate: 10, monthlyContribution: 500 },
};

beforeEach(() => {
  mockReplaceFn.mockReset();
  mockBackFn.mockReset();
  mockCanGoBackFn.mockReset();
  mockCanGoBackFn.mockReturnValue(true);
  mockedSearchParams = { id: "g-1" };
  updateStub = buildUpdateStub();
  mockedUseUpdate.mockReturnValue(updateStub as never);
  mockedUseGoalsQuery.mockReturnValue({
    data: { goals: [aGoal] },
    isLoading: false,
  } as never);
  mockedUseGoalProjectionQuery.mockReturnValue({
    data: aProjection,
    isLoading: false,
    isSuccess: true,
  } as never);
});

describe("useGoalScenarioScreenController", () => {
  it("hydrates the form once with the baseline projection", () => {
    const { result } = renderHook(() => useGoalScenarioScreenController());
    expect(result.current.hasInitialised).toBe(true);
    expect(result.current.form.monthlyContribution).toBe(500);
    expect(result.current.form.annualReturnRatePct).toBe(10);
    expect(result.current.form.horizonMonths).toBe(24);
  });

  it("does not hydrate when projection has not loaded yet", () => {
    mockedUseGoalProjectionQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      isSuccess: false,
    } as never);
    const { result } = renderHook(() => useGoalScenarioScreenController());
    expect(result.current.hasInitialised).toBe(false);
    expect(result.current.form.monthlyContribution).toBe(0);
  });

  it("falls back to defaults when assumptions are null", () => {
    mockedUseGoalProjectionQuery.mockReturnValue({
      data: {
        ...aProjection,
        assumptions: { annualReturnRate: null, monthlyContribution: null },
      },
      isLoading: false,
      isSuccess: true,
    } as never);
    const { result } = renderHook(() => useGoalScenarioScreenController());
    expect(result.current.form.monthlyContribution).toBe(0);
    expect(result.current.form.annualReturnRatePct).toBe(8);
  });

  it("recomputes the scenario when monthly contribution changes", () => {
    const { result } = renderHook(() => useGoalScenarioScreenController());
    const initialBalance = result.current.scenario.finalBalance;
    act(() => {
      result.current.setMonthlyContribution(2000);
    });
    expect(result.current.scenario.finalBalance).toBeGreaterThan(initialBalance);
  });

  it("clamps negative inputs to zero", () => {
    const { result } = renderHook(() => useGoalScenarioScreenController());
    act(() => {
      result.current.setMonthlyContribution(-100);
    });
    expect(result.current.form.monthlyContribution).toBe(0);
    act(() => {
      result.current.setAnnualReturnRatePct(-5);
    });
    expect(result.current.form.annualReturnRatePct).toBe(0);
  });

  it("clamps horizon to a minimum of one month", () => {
    const { result } = renderHook(() => useGoalScenarioScreenController());
    act(() => {
      result.current.setHorizonMonths(0);
    });
    expect(result.current.form.horizonMonths).toBe(1);
  });

  it("returns null goal when id is missing from URL", () => {
    mockedSearchParams = {};
    const { result } = renderHook(() => useGoalScenarioScreenController());
    expect(result.current.goalId).toBeNull();
    expect(result.current.goal).toBeNull();
  });

  it("handleResetToBaseline restores the captured baseline", () => {
    const { result } = renderHook(() => useGoalScenarioScreenController());
    act(() => {
      result.current.setMonthlyContribution(9_999);
    });
    expect(result.current.form.monthlyContribution).toBe(9_999);
    act(() => {
      result.current.handleResetToBaseline();
    });
    expect(result.current.form.monthlyContribution).toBe(500);
  });

  it("handleSaveTargetDate calls update mutation with computed date", () => {
    const { result } = renderHook(() => useGoalScenarioScreenController());
    act(() => {
      result.current.setMonthlyContribution(5_000);
    });
    act(() => {
      result.current.handleSaveTargetDate();
    });
    expect(updateStub.mutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({ goalId: "g-1" }),
    );
    const command = updateStub.mutateAsync.mock.calls[0]![0];
    expect(typeof command.targetDate).toBe("string");
  });

  it("handleSaveTargetDate is a no-op when scenario never reaches target", () => {
    const { result } = renderHook(() => useGoalScenarioScreenController());
    act(() => {
      result.current.setMonthlyContribution(0);
      result.current.setAnnualReturnRatePct(0);
      result.current.setHorizonMonths(1);
    });
    act(() => {
      result.current.handleSaveTargetDate();
    });
    expect(updateStub.mutateAsync).not.toHaveBeenCalled();
  });

  it("handleBack pops the stack when history is available", () => {
    const { result } = renderHook(() => useGoalScenarioScreenController());
    act(() => {
      result.current.handleBack();
    });
    expect(mockBackFn).toHaveBeenCalled();
    expect(mockReplaceFn).not.toHaveBeenCalled();
  });

  it("handleBack falls back to /metas when no history", () => {
    mockCanGoBackFn.mockReturnValue(false);
    const { result } = renderHook(() => useGoalScenarioScreenController());
    act(() => {
      result.current.handleBack();
    });
    expect(mockReplaceFn).toHaveBeenCalledWith("/metas");
  });
});
