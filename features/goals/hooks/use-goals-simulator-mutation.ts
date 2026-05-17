import { useAnalytics } from "@/core/observability/use-analytics";
import { createApiMutation } from "@/core/query/create-api-mutation";
import type {
  SimulateGoalPlanCommand,
  SimulatedGoalPlan,
} from "@/features/goals/contracts";
import { buildGoalSimulatedAnalyticsProperties } from "@/features/goals/services/goal-analytics";
import { goalsService } from "@/features/goals/services/goals-service";

export const useSimulateGoalMutation = () => {
  const analytics = useAnalytics();
  return createApiMutation<SimulatedGoalPlan, SimulateGoalPlanCommand>(
    (command) => goalsService.simulatePlan(command),
    {
      onSuccess: (plan) => {
        analytics.capture(
          "goal.simulated",
          buildGoalSimulatedAnalyticsProperties(plan),
        );
      },
    },
  );
};
