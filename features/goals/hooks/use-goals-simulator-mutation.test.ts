import type { AnalyticsClient } from "@/core/observability/analytics-types";
import type {
  SimulateGoalPlanCommand,
  SimulatedGoalPlan,
} from "@/features/goals/contracts";
import { useSimulateGoalMutation } from "@/features/goals/hooks/use-goals-simulator-mutation";
import { goalsService } from "@/features/goals/services/goals-service";

const mockCreateApiMutation = jest.fn();
const mockAnalyticsClient: jest.Mocked<AnalyticsClient> = {
  capture: jest.fn(),
  identify: jest.fn(),
  screen: jest.fn(),
  reset: jest.fn(),
};

jest.mock("@/core/query/create-api-mutation", () => ({
  createApiMutation: (...args: readonly unknown[]) => mockCreateApiMutation(...args),
}));

jest.mock("@/core/observability/use-analytics", () => ({
  useAnalytics: () => mockAnalyticsClient,
}));

jest.mock("@/features/goals/services/goals-service", () => ({
  goalsService: {
    simulatePlan: jest.fn(),
  },
}));

const mockedService = goalsService as jest.Mocked<typeof goalsService>;

describe("useSimulateGoalMutation analytics", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateApiMutation.mockImplementation((fn: unknown, options: unknown) => ({
      fn,
      options,
    }));
  });

  it("dispara goalsService.simulatePlan", async () => {
    const command: SimulateGoalPlanCommand = {
      targetAmount: 50000,
      currentAmount: 10000,
      monthlyContribution: 500,
    };

    useSimulateGoalMutation();
    const [fn] = mockCreateApiMutation.mock.calls[0] ?? [];

    await (fn as (cmd: SimulateGoalPlanCommand) => Promise<unknown>)(command);

    expect(mockedService.simulatePlan).toHaveBeenCalledWith(command);
  });

  it("captura goal.simulated sem enviar valores financeiros brutos", async () => {
    const command: SimulateGoalPlanCommand = {
      targetAmount: 50000,
      currentAmount: 10000,
      monthlyIncome: 12000,
      monthlyExpenses: 7000,
      monthlyContribution: 500,
    };
    const plan: SimulatedGoalPlan = {
      monthlyContribution: 500,
      monthsToTarget: 24,
      recommendedSavingsRate: 0.1,
      projectedFinishDate: "2028-01-01",
      disclaimer: null,
    };

    useSimulateGoalMutation();
    const [, options] = mockCreateApiMutation.mock.calls[0] ?? [];

    (
      options as {
        readonly onSuccess: (
          data: SimulatedGoalPlan,
          variables: SimulateGoalPlanCommand,
        ) => void;
      }
    ).onSuccess(plan, command);

    expect(mockAnalyticsClient.capture).toHaveBeenCalledWith("goal.simulated", {
      horizonMonths: 24,
      contributionBucket: "under_1k",
    });
    const capturedPayload = JSON.stringify(mockAnalyticsClient.capture.mock.calls);
    expect(capturedPayload).not.toContain(String(command.targetAmount));
    expect(capturedPayload).not.toContain(String(command.currentAmount));
    expect(capturedPayload).not.toContain(String(command.monthlyIncome));
    expect(capturedPayload).not.toContain(String(command.monthlyExpenses));
    expect(capturedPayload).not.toContain(String(command.monthlyContribution));
  });
});
