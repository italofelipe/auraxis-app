import { useQueryClient } from "@tanstack/react-query";

import { useAnalytics } from "@/core/observability/use-analytics";
import { createApiMutation } from "@/core/query/create-api-mutation";
import { queryKeys } from "@/core/query/query-keys";
import type {
  CreateGoalCommand,
  GoalRecord,
  UpdateGoalCommand,
} from "@/features/goals/contracts";
import { buildGoalCreatedAnalyticsProperties } from "@/features/goals/services/goal-analytics";
import { goalsService } from "@/features/goals/services/goals-service";

const useInvalidateGoals = () => {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.goals.root });
  };
};

export const useCreateGoalMutation = () => {
  const analytics = useAnalytics();
  const invalidate = useInvalidateGoals();
  return createApiMutation<GoalRecord, CreateGoalCommand>(
    (command) => goalsService.createGoal(command),
    {
      onSuccess: (goal) => {
        analytics.capture(
          "goal.created",
          buildGoalCreatedAnalyticsProperties(goal),
        );
        invalidate();
      },
    },
  );
};

export const useUpdateGoalMutation = () => {
  const invalidate = useInvalidateGoals();
  return createApiMutation<GoalRecord, UpdateGoalCommand>(
    (command) => goalsService.updateGoal(command),
    { onSuccess: invalidate },
  );
};

export const useDeleteGoalMutation = () => {
  const invalidate = useInvalidateGoals();
  return createApiMutation<void, string>(
    (goalId) => goalsService.deleteGoal(goalId),
    { onSuccess: invalidate },
  );
};
