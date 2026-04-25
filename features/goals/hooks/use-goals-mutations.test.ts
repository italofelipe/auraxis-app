import {
  useCreateGoalMutation,
  useDeleteGoalMutation,
  useUpdateGoalMutation,
} from "@/features/goals/hooks/use-goals-mutations";
import { goalsService } from "@/features/goals/services/goals-service";

const mockCreateApiMutation = jest.fn();

jest.mock("@/core/query/create-api-mutation", () => ({
  createApiMutation: (...args: readonly unknown[]) => mockCreateApiMutation(...args),
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
