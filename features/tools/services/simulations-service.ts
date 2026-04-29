import type { AxiosInstance } from "axios";

import { unwrapEnvelopeData } from "@/core/http/contracts";
import { httpClient } from "@/core/http/http-client";
import type {
  DeleteSimulationCommand,
  SaveSimulationCommand,
  SaveSimulationRequestBody,
  SimulationListPagination,
  SimulationListQuery,
  SimulationListResponse,
  SimulationMetadata,
  SimulationRecord,
  SimulationRecordResponseEnvelope,
} from "@/features/tools/contracts";
import { apiContractMap } from "@/shared/contracts/api-contract-map";
import { resolveApiContractPath } from "@/shared/contracts/resolve-api-contract-path";

interface SimulationRecordPayload {
  readonly id: string;
  readonly tool_id: string;
  readonly rule_version: string;
  readonly inputs?: Record<string, unknown>;
  readonly result?: Record<string, unknown>;
  readonly metadata?: SimulationMetadata | null;
  readonly saved?: boolean;
  readonly goal_id?: string | null;
  readonly created_at: string;
}

interface SimulationListPayload {
  readonly items?: readonly SimulationRecordPayload[];
}

interface SimulationListMeta {
  readonly pagination?: {
    readonly page?: number;
    readonly per_page?: number;
    readonly total?: number;
    readonly has_more?: boolean;
  };
}

const mapRecord = (raw: SimulationRecordPayload): SimulationRecord => ({
  id: raw.id,
  toolId: raw.tool_id,
  ruleVersion: raw.rule_version,
  inputs: raw.inputs ?? {},
  result: raw.result ?? {},
  metadata: raw.metadata ?? null,
  saved: raw.saved ?? false,
  goalId: raw.goal_id ?? null,
  createdAt: raw.created_at,
});

const buildSaveBody = (
  command: SaveSimulationCommand,
): SaveSimulationRequestBody => ({
  tool_id: command.toolId,
  rule_version: command.ruleVersion,
  inputs: command.inputs,
  result: command.result,
  ...(command.metadata !== undefined && { metadata: command.metadata }),
});

const pickNumber = (
  value: number | undefined,
  fallback: number,
): number => (typeof value === "number" ? value : fallback);

const pickBoolean = (value: boolean | undefined, fallback: boolean): boolean =>
  typeof value === "boolean" ? value : fallback;

const mapPagination = (
  meta: SimulationListMeta | undefined,
  itemsLength: number,
  query: SimulationListQuery,
): SimulationListPagination => {
  const pagination = meta?.pagination;
  return {
    page: pickNumber(pagination?.page, query.page ?? 1),
    perPage: pickNumber(pagination?.per_page, query.perPage ?? itemsLength),
    total: pickNumber(pagination?.total, itemsLength),
    hasMore: pickBoolean(pagination?.has_more, false),
  };
};

interface EnvelopeShape<T> {
  readonly data?: T;
  readonly meta?: SimulationListMeta;
}

const buildListSimulations = (
  client: AxiosInstance,
) => async (
  query: SimulationListQuery = {},
): Promise<SimulationListResponse> => {
  const response = await client.get(apiContractMap.simulationsList.path, {
    params: {
      page: query.page,
      per_page: query.perPage,
    },
  });
  const envelope = response.data as EnvelopeShape<SimulationListPayload>;
  const payload = unwrapEnvelopeData<SimulationListPayload>(
    envelope as { readonly items?: readonly SimulationRecordPayload[] },
  );
  const items = (payload.items ?? []).map(mapRecord);
  return {
    items,
    pagination: mapPagination(envelope.meta, items.length, query),
  };
};

const buildDeleteSimulation = (
  client: AxiosInstance,
) => async (command: DeleteSimulationCommand): Promise<void> => {
  await client.delete(
    resolveApiContractPath(apiContractMap.simulationDelete.path, {
      simulation_id: command.simulationId,
    }),
  );
};

const buildSaveSimulation = (
  client: AxiosInstance,
) => async (command: SaveSimulationCommand): Promise<SimulationRecord> => {
  const response = await client.post(
    apiContractMap.simulationsSave.path,
    buildSaveBody(command),
  );
  const payload = unwrapEnvelopeData<SimulationRecordResponseEnvelope>(
    response.data as SimulationRecordResponseEnvelope,
  );
  return mapRecord(payload.simulation as SimulationRecordPayload);
};

export interface SimulationsService {
  readonly listSimulations: (
    query?: SimulationListQuery,
  ) => Promise<SimulationListResponse>;
  readonly saveSimulation: (
    command: SaveSimulationCommand,
  ) => Promise<SimulationRecord>;
  readonly deleteSimulation: (command: DeleteSimulationCommand) => Promise<void>;
}

export const createSimulationsService = (
  client: AxiosInstance,
): SimulationsService => ({
  listSimulations: buildListSimulations(client),
  saveSimulation: buildSaveSimulation(client),
  deleteSimulation: buildDeleteSimulation(client),
});

export const simulationsService: SimulationsService =
  createSimulationsService(httpClient);
