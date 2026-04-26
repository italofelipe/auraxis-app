import { createApiQuery } from "@/core/query/create-api-query";
import { queryKeys } from "@/core/query/query-keys";
import type {
  GoalListResponse,
  GoalPlan,
  GoalProjection,
} from "@/features/goals/contracts";
import { goalsService } from "@/features/goals/services/goals-service";

export const useGoalsQuery = () => {
  return createApiQuery<GoalListResponse>(
    queryKeys.goals.list(),
    () => goalsService.listGoals(),
  );
};

export const useGoalPlanQuery = (goalId: string | null) => {
  return createApiQuery<GoalPlan>(
    queryKeys.goals.plan(goalId ?? "__disabled__"),
    () => goalsService.getPlan(goalId as string),
    { enabled: !!goalId },
  );
};

export const useGoalProjectionQuery = (goalId: string | null) => {
  return createApiQuery<GoalProjection>(
    queryKeys.goals.projection(goalId ?? "__disabled__"),
    () => goalsService.getProjection(goalId as string),
    { enabled: !!goalId },
  );
};
