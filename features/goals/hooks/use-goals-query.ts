import { createApiQuery } from "@/core/query/create-api-query";
import { queryKeys } from "@/core/query/query-keys";
import type { GoalListResponse } from "@/features/goals/contracts";
import { goalsService } from "@/features/goals/services/goals-service";

export const useGoalsQuery = () => {
  return createApiQuery<GoalListResponse>(
    queryKeys.goals.list(),
    () => goalsService.listGoals(),
  );
};
