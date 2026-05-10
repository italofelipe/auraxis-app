/**
 * E2E — Goals flow (RNTL + MSW)
 *
 * Integration tests for the goals feature domain.
 * Tests query hooks, mutation hooks, and the screen controller using
 * service-layer mocks. MSW server lifecycle is maintained.
 *
 * Closes #375
 */
import { act, renderHook, waitFor } from "@testing-library/react-native";

import { server } from "@/__mocks__/msw-server";
import { handlers } from "@/__tests__/e2e/handlers";
import { goalListFixture } from "@/features/goals/mocks";
import { goalsService } from "@/features/goals/services/goals-service";
import type { GoalRecord } from "@/features/goals/contracts";
import { createTestQueryClient } from "@/shared/testing/test-query-client";
import { createTestHookWrapper } from "@/shared/testing/test-providers";

// Setup MSW handlers for this suite (lifecycle integration)
beforeEach(() => {
  server.use(...handlers);
});

// ---------------------------------------------------------------------------
// Service-layer mocks
// ---------------------------------------------------------------------------
jest.mock("@/features/goals/services/goals-service", () => ({
  goalsService: {
    listGoals: jest.fn(),
    createGoal: jest.fn(),
    updateGoal: jest.fn(),
    deleteGoal: jest.fn(),
    getPlan: jest.fn(),
    simulatePlan: jest.fn(),
    getProjection: jest.fn(),
  },
}));

jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    canGoBack: jest.fn(() => false),
  }),
  usePathname: jest.fn(() => "/"),
  useLocalSearchParams: jest.fn(() => ({})),
  useSegments: jest.fn(() => []),
  Link: ({ children }: { children: React.ReactNode }) => children,
  Redirect: () => null,
  Stack: { Screen: () => null },
  Tabs: { Screen: () => null },
}));

const mockedGoalsService = jest.mocked(goalsService);

const newGoalFixture: GoalRecord = {
  id: "goal-new",
  title: "Viagem para Europa",
  targetAmount: 20000,
  currentAmount: 0,
  targetDate: "2027-06-30",
  status: "in_progress",
};

// ---------------------------------------------------------------------------
// Goals E2E: list, progress view model, create
// ---------------------------------------------------------------------------

describe("Goals E2E flow", () => {
  let queryClient: ReturnType<typeof createTestQueryClient>;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    mockedGoalsService.listGoals.mockResolvedValue(goalListFixture);
    mockedGoalsService.createGoal.mockResolvedValue(newGoalFixture);
    mockedGoalsService.updateGoal.mockResolvedValue(goalListFixture.goals[0]);
    mockedGoalsService.deleteGoal.mockResolvedValue(undefined);
  });

  it("loads goal list from service with correct data", async () => {
    const {
      useGoalsQuery,
      // eslint-disable-next-line @typescript-eslint/no-require-imports
    } = require("@/features/goals/hooks/use-goals-query");

    const wrapper = createTestHookWrapper({ queryClient });
    const { result } = renderHook(() => useGoalsQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.goals).toHaveLength(
      goalListFixture.goals.length,
    );
    expect(result.current.data?.goals[0].title).toBe(
      goalListFixture.goals[0].title,
    );
  });

  it("screen controller builds progress view model from fetched goals", async () => {
    const {
      useGoalsScreenController,
      // eslint-disable-next-line @typescript-eslint/no-require-imports
    } = require("@/features/goals/hooks/use-goals-screen-controller");

    const wrapper = createTestHookWrapper({ queryClient });
    const { result } = renderHook(() => useGoalsScreenController(), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.goals.length).toBeGreaterThan(0);
    });

    const firstGoal = result.current.goals[0];
    expect(firstGoal).toHaveProperty("id");
    expect(firstGoal).toHaveProperty("title");
    // GoalProgressView uses "progress" (0-100 rounded int), not "progressPercent"
    expect(firstGoal).toHaveProperty("progress");
    expect(typeof firstGoal.progress).toBe("number");
    expect(firstGoal.progress).toBeGreaterThanOrEqual(0);
  });

  it("creates a new goal via the create mutation", async () => {
    const {
      useCreateGoalMutation,
      // eslint-disable-next-line @typescript-eslint/no-require-imports
    } = require("@/features/goals/hooks/use-goals-mutations");

    const wrapper = createTestHookWrapper({ queryClient });
    const { result } = renderHook(() => useCreateGoalMutation(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        title: "Viagem para Europa",
        targetAmount: 20000,
        currentAmount: 0,
        targetDate: "2027-06-30",
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(mockedGoalsService.createGoal).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Viagem para Europa",
        targetAmount: 20000,
      }),
    );
  });

  it("returns error state when goal list service rejects", async () => {
    mockedGoalsService.listGoals.mockRejectedValueOnce(
      new Error("Servico indisponivel"),
    );

    const {
      useGoalsQuery,
      // eslint-disable-next-line @typescript-eslint/no-require-imports
    } = require("@/features/goals/hooks/use-goals-query");

    const wrapper = createTestHookWrapper({ queryClient });
    const { result } = renderHook(() => useGoalsQuery(), { wrapper });

    await waitFor(
      () => {
        expect(result.current.isError).toBe(true);
      },
      { timeout: 5000 },
    );
  });

  it("summary reflects correct counts: total, active, completed", async () => {
    const {
      useGoalsScreenController,
      // eslint-disable-next-line @typescript-eslint/no-require-imports
    } = require("@/features/goals/hooks/use-goals-screen-controller");

    const wrapper = createTestHookWrapper({ queryClient });
    const { result } = renderHook(() => useGoalsScreenController(), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.summary.total).toBeGreaterThan(0);
    });

    expect(result.current.summary).toMatchObject({
      total: expect.any(Number),
      active: expect.any(Number),
      completed: expect.any(Number),
    });
    expect(
      result.current.summary.active + result.current.summary.completed,
    ).toBe(result.current.summary.total);
  });
});
