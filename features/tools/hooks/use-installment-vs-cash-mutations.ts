import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/core/query/query-keys";
import { installmentVsCashService } from "@/features/tools/services/installment-vs-cash-service";
import { INSTALLMENT_VS_CASH_TOOL_ID } from "@/shared/validators/installment-vs-cash";
import type {
  CreateInstallmentVsCashGoalPayload,
  CreateInstallmentVsCashPlannedExpensePayload,
  InstallmentVsCashCalculation,
  InstallmentVsCashCalculationRequestDto,
  InstallmentVsCashGoalBridgeResponse,
  InstallmentVsCashPlannedExpenseBridgeResponse,
  InstallmentVsCashSavedCalculation,
} from "@/features/tools/contracts";

interface GoalVariables {
  readonly simulationId: string;
  readonly payload: CreateInstallmentVsCashGoalPayload;
}

interface PlannedExpenseVariables {
  readonly simulationId: string;
  readonly payload: CreateInstallmentVsCashPlannedExpensePayload;
}

export type { GoalVariables, PlannedExpenseVariables };

export const useInstallmentVsCashCalculationMutation = () => {
  return useMutation<
    InstallmentVsCashCalculation,
    Error,
    InstallmentVsCashCalculationRequestDto
  >({
    mutationFn: installmentVsCashService.calculate,
  });
};

export const useSaveInstallmentVsCashMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<
    InstallmentVsCashSavedCalculation,
    Error,
    InstallmentVsCashCalculationRequestDto
  >({
    mutationFn: installmentVsCashService.save,
    onSuccess: async (): Promise<void> => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.tools.simulationHistory(INSTALLMENT_VS_CASH_TOOL_ID) });
    },
  });
};

export const useCreateGoalFromInstallmentVsCashMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<
    InstallmentVsCashGoalBridgeResponse,
    Error,
    GoalVariables
  >({
    mutationFn: ({ simulationId, payload }: GoalVariables) => {
      return installmentVsCashService.createGoalFromSimulation(simulationId, payload);
    },
    onSuccess: async (): Promise<void> => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.tools.simulationHistory(INSTALLMENT_VS_CASH_TOOL_ID) });
    },
  });
};

export const useCreatePlannedExpenseFromInstallmentVsCashMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<
    InstallmentVsCashPlannedExpenseBridgeResponse,
    Error,
    PlannedExpenseVariables
  >({
    mutationFn: ({ simulationId, payload }: PlannedExpenseVariables) => {
      return installmentVsCashService.createPlannedExpenseFromSimulation(
        simulationId,
        payload,
      );
    },
    onSuccess: async (): Promise<void> => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.tools.simulationHistory(INSTALLMENT_VS_CASH_TOOL_ID) });
    },
  });
};
