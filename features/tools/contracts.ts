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
 * Optional user-supplied label/notes attached to a saved simulation.
 * Mirrors the canonical `metadata` jsonb on the API side (DEC-196).
 */
export interface SimulationMetadata {
  readonly label?: string | null;
  readonly notes?: string | null;
  readonly [key: string]: unknown;
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
  readonly metadata: SimulationMetadata | null;
  readonly saved: boolean;
  readonly goalId: string | null;
  readonly createdAt: string;
}

/**
 * Domain payload built by a tool screen before hitting the canonical
 * `POST /simulations` endpoint.
 */
export interface SaveSimulationCommand {
  readonly toolId: string;
  readonly ruleVersion: string;
  readonly inputs: Readonly<Record<string, unknown>>;
  readonly result: Readonly<Record<string, unknown>>;
  readonly metadata?: SimulationMetadata | null;
}

/**
 * Wire-format body for `POST /simulations` (snake_case as the backend
 * accepts).
 */
export interface SaveSimulationRequestBody {
  readonly tool_id: string;
  readonly rule_version: string;
  readonly inputs: Readonly<Record<string, unknown>>;
  readonly result: Readonly<Record<string, unknown>>;
  readonly metadata?: SimulationMetadata | null;
}

/**
 * Response envelope returned by the canonical save endpoint, before the
 * client unwraps it into a {@link SimulationRecord}.
 */
export interface SimulationRecordResponseEnvelope {
  readonly simulation: {
    readonly id: string;
    readonly user_id: string;
    readonly tool_id: string;
    readonly rule_version: string;
    readonly inputs: Readonly<Record<string, unknown>>;
    readonly result: Readonly<Record<string, unknown>>;
    readonly metadata: SimulationMetadata | null;
    readonly saved: boolean;
    readonly created_at: string;
  };
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
