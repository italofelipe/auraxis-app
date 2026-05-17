import {
  useCreateGoalMutation,
  useDeleteGoalMutation,
  useUpdateGoalMutation,
} from "@/features/goals/hooks/use-goals-mutations";
import { goalsService } from "@/features/goals/services/goals-service";
import type { AnalyticsClient } from "@/core/observability/analytics-types";
import type { CreateGoalCommand, GoalRecord } from "@/features/goals/contracts";

const mockCreateApiMutation = jest.fn();
const mockAnalyticsClient: jest.Mocked<AnalyticsClient> = {
  capture: jest.fn(),
  identify: jest.fn(),
  reset: jest.fn(),
};

jest.mock("@/core/query/create-api-mutation", () => ({
  createApiMutation: (...args: readonly unknown[]) => mockCreateApiMutation(...args),
}));

jest.mock("@/core/observability/use-analytics", () => ({
  useAnalytics: () => mockAnalyticsClient,
}));

jest.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries: jest.fn() }),
}));

jest.mock("@/features/goals/services/goals-service", () => ({
  goalsService: {
    createGoal: jest.fn(),
    updateGoal: jest.fn(),
    deleteGoal: jest.fn(),
  },
}));

const mockedService = goalsService as jest.Mocked<typeof goalsService>;

describe("goals mutations", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateApiMutation.mockImplementation((fn: unknown, options: unknown) => ({
      fn,
      options,
    }));
  });

  it("create dispara goalsService.createGoal", async () => {
    useCreateGoalMutation();
    const [fn] = mockCreateApiMutation.mock.calls[0] ?? [];
    await (fn as (cmd: unknown) => Promise<unknown>)({
      title: "X",
      targetAmount: 1,
    });
    expect(mockedService.createGoal).toHaveBeenCalledWith({
      title: "X",
      targetAmount: 1,
    });
  });

  it("captura goal.created sem enviar titulo ou valor bruto", async () => {
    const command: CreateGoalCommand = {
      title: "Casa da familia",
      targetAmount: 100000,
      currentAmount: 25000,
    };
    const createdGoal: GoalRecord = {
      id: "goal-analytics",
      title: command.title,
      targetAmount: command.targetAmount,
      currentAmount: command.currentAmount ?? 0,
      targetDate: null,
      status: "in_progress",
    };

    useCreateGoalMutation();
    const [, options] = mockCreateApiMutation.mock.calls[0] ?? [];

    await (
      options as {
        readonly onSuccess: (
          data: GoalRecord,
          variables: CreateGoalCommand,
        ) => Promise<void>;
      }
    ).onSuccess(createdGoal, command);

    expect(mockAnalyticsClient.capture).toHaveBeenCalledWith("goal.created", {
      targetAmountBucket: "100k_plus",
    });
    expect(JSON.stringify(mockAnalyticsClient.capture.mock.calls)).not.toContain(
      command.title,
    );
    expect(JSON.stringify(mockAnalyticsClient.capture.mock.calls)).not.toContain(
      String(command.targetAmount),
    );
  });

  it("update dispara goalsService.updateGoal", async () => {
    useUpdateGoalMutation();
    const [fn] = mockCreateApiMutation.mock.calls[0] ?? [];
    await (fn as (cmd: unknown) => Promise<unknown>)({ goalId: "g1", title: "Y" });
    expect(mockedService.updateGoal).toHaveBeenCalledWith({ goalId: "g1", title: "Y" });
  });

  it("delete dispara goalsService.deleteGoal", async () => {
    useDeleteGoalMutation();
    const [fn] = mockCreateApiMutation.mock.calls[0] ?? [];
    await (fn as (id: string) => Promise<unknown>)("g1");
    expect(mockedService.deleteGoal).toHaveBeenCalledWith("g1");
  });
});
