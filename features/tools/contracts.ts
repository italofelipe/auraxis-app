export type { ToolDefinition, ToolsCatalog } from "@/types/contracts/tools";
export type {
  CreateGoalFromInstallmentVsCashDto,
  CreateInstallmentVsCashGoalPayload,
  CreateGoalFromInstallmentVsCashResponseDto,
  CreatePlannedExpenseFromInstallmentVsCashDto,
  CreateInstallmentVsCashPlannedExpensePayload,
  CreatePlannedExpenseFromInstallmentVsCashResponseDto,
  InstallmentVsCashCalculation,
  InstallmentVsCashCalculationRequestDto,
  InstallmentVsCashCalculationResponseDto,
  InstallmentVsCashGoalBridgeResponse,
  InstallmentVsCashHistoryResponseDto,
  InstallmentVsCashHistoryResponseDto as InstallmentVsCashHistoryResponse,
  InstallmentVsCashPlannedExpenseBridgeResponse,
  InstallmentVsCashSavedCalculation,
  InstallmentVsCashSavedSimulation,
  InstallmentVsCashSaveResponseDto,
  OpportunityRateType,
  SelectedPaymentOption,
} from "@/types/contracts/installment-vs-cash";

export interface InstallmentVsCashHistoryQuery {
  readonly page?: number;
  readonly perPage?: number;
}
