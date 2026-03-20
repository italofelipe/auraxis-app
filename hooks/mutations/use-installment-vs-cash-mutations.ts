import { useMutation, useQueryClient } from "@tanstack/react-query";

import { installmentVsCashApi } from "@/lib/installment-vs-cash-api";
import { INSTALLMENT_VS_CASH_TOOL_ID } from "@/shared/validators/installment-vs-cash";
import type {
  CreateInstallmentVsCashGoalPayload,
  CreateInstallmentVsCashPlannedExpensePayload,
  InstallmentVsCashCalculation,
  InstallmentVsCashCalculationRequestDto,
  InstallmentVsCashGoalBridgeResponse,
  InstallmentVsCashPlannedExpenseBridgeResponse,
  InstallmentVsCashSavedCalculation,
} from "@/types/contracts/installment-vs-cash";

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
    mutationFn: installmentVsCashApi.calculate,
  });
};

export const useSaveInstallmentVsCashMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<
    InstallmentVsCashSavedCalculation,
    Error,
    InstallmentVsCashCalculationRequestDto
  >({
    mutationFn: installmentVsCashApi.save,
    onSuccess: async (): Promise<void> => {
      await queryClient.invalidateQueries({
        queryKey: ["simulations", INSTALLMENT_VS_CASH_TOOL_ID],
      });
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
      return installmentVsCashApi.createGoalFromSimulation(simulationId, payload);
    },
    onSuccess: async (): Promise<void> => {
      await queryClient.invalidateQueries({
        queryKey: ["simulations", INSTALLMENT_VS_CASH_TOOL_ID],
      });
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
      return installmentVsCashApi.createPlannedExpenseFromSimulation(
        simulationId,
        payload,
      );
    },
    onSuccess: async (): Promise<void> => {
      await queryClient.invalidateQueries({
        queryKey: ["simulations", INSTALLMENT_VS_CASH_TOOL_ID],
      });
    },
  });
};
