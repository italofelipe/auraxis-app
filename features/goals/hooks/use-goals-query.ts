import { createApiQuery } from "@/core/query/create-api-query";
import type { GoalListResponse } from "@/features/goals/contracts";
import { goalsService } from "@/features/goals/services/goals-service";

export const useGoalsQuery = () => {
  return createApiQuery<GoalListResponse>(
    ["goals", "list"],
    () => goalsService.listGoals(),
  );
};
