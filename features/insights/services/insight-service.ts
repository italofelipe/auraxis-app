import type { AxiosInstance } from "axios";

import { ApiError } from "@/core/http/api-error";
import { unwrapEnvelopeData } from "@/core/http/contracts";
import { httpClient } from "@/core/http/http-client";
import type { UserInsight } from "@/features/insights/contracts";
import { apiContractMap } from "@/shared/contracts/api-contract-map";
import { resolveApiContractPath } from "@/shared/contracts/resolve-api-contract-path";

interface UserInsightPayload {
  readonly id: string;
  readonly content: string;
  readonly key_metric: string;
  readonly period_start: string;
  readonly period_end: string;
  readonly status: UserInsight["status"];
  readonly generated_at: string;
  readonly read_at: string | null;
}

const mapInsight = (payload: UserInsightPayload): UserInsight => {
  return {
    id: payload.id,
    content: payload.content,
    keyMetric: payload.key_metric,
    periodStart: payload.period_start,
    periodEnd: payload.period_end,
    status: payload.status,
    generatedAt: payload.generated_at,
    readAt: payload.read_at,
  };
};

const isNotFoundError = (error: unknown): boolean => {
  return error instanceof ApiError && error.status === 404;
};

export const createInsightService = (client: AxiosInstance) => {
  return {
    getLatest: async (): Promise<UserInsight | null> => {
      try {
        const response = await client.get(apiContractMap.insightsLatest.path);
        const payload = unwrapEnvelopeData<{
          readonly insight?: UserInsightPayload | null;
        }>(response.data);
        return payload.insight ? mapInsight(payload.insight) : null;
      } catch (error) {
        if (isNotFoundError(error)) {
          return null;
        }
        throw error;
      }
    },
    markAsRead: async (insightId: string): Promise<void> => {
      await client.post(
        resolveApiContractPath(apiContractMap.insightsMarkRead.path, {
          insight_id: insightId,
        }),
      );
    },
  };
};

export const insightService = createInsightService(httpClient);
