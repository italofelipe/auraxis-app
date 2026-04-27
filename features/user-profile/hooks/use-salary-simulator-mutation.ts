import { createApiMutation } from "@/core/query/create-api-mutation";
import type {
  SalaryIncreaseSimulation,
  SimulateSalaryIncreaseCommand,
} from "@/features/user-profile/contracts";
import { userProfileService } from "@/features/user-profile/services/user-profile-service";

export const useSalarySimulatorMutation = () => {
  return createApiMutation<SalaryIncreaseSimulation, SimulateSalaryIncreaseCommand>(
    (command) => userProfileService.simulateSalaryIncrease(command),
  );
};
