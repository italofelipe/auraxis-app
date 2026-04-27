import { createApiMutation } from "@/core/query/create-api-mutation";
import type {
  SimulateGoalPlanCommand,
  SimulatedGoalPlan,
} from "@/features/goals/contracts";
import { goalsService } from "@/features/goals/services/goals-service";

export const useSimulateGoalMutation = () => {
  return createApiMutation<SimulatedGoalPlan, SimulateGoalPlanCommand>(
    (command) => goalsService.simulatePlan(command),
  );
};
