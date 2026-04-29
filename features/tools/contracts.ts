export type {
  ToolCategory,
  ToolDefinition,
  ToolsCatalog,
} from "@/types/contracts/tools";
export { TOOL_CATEGORIES } from "@/types/contracts/tools";
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

/**
 * Cross-tool simulation record listed in the simulations history.
 * Mirrors the canonical `SimulationSchema` in auraxis-api so the
 * domain layer can ingest the response without re-shaping per tool.
 */
export interface SimulationRecord {
  readonly id: string;
  readonly toolId: string;
  readonly ruleVersion: string;
  readonly inputs: Readonly<Record<string, unknown>>;
  readonly result: Readonly<Record<string, unknown>>;
  readonly saved: boolean;
  readonly goalId: string | null;
  readonly createdAt: string;
}

export interface SimulationListPagination {
  readonly page: number;
  readonly perPage: number;
  readonly total: number;
  readonly hasMore: boolean;
}

export interface SimulationListResponse {
  readonly items: readonly SimulationRecord[];
  readonly pagination: SimulationListPagination;
}

export interface SimulationListQuery {
  readonly page?: number;
  readonly perPage?: number;
}

export interface DeleteSimulationCommand {
  readonly simulationId: string;
}
