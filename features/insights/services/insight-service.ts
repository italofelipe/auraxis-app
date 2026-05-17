import type { AxiosInstance } from "axios";

import { ApiError } from "@/core/http/api-error";
import { unwrapEnvelopeData } from "@/core/http/contracts";
import { httpClient } from "@/core/http/http-client";
import type {
  InsightItem,
  InsightPeriodType,
  InsightStatus,
  InsightSummary,
  UserInsight,
} from "@/features/insights/contracts";
import { apiContractMap } from "@/shared/contracts/api-contract-map";
import { resolveApiContractPath } from "@/shared/contracts/resolve-api-contract-path";

interface UserInsightPayload {
  readonly id: string;
  readonly content?: string | null;
  readonly key_metric?: string | null;
  readonly items?: unknown;
  readonly summary?: unknown;
  readonly period_type?: string | null;
  readonly period_label?: string | null;
  readonly period_start: string;
  readonly period_end: string;
  readonly status: string;
  readonly generated_at?: string | null;
  readonly created_at?: string | null;
  readonly read_at: string | null;
  readonly model?: string | null;
  readonly tokens_used?: number | null;
  readonly cost_usd?: number | null;
  readonly cached?: boolean | null;
  readonly context_version?: string | null;
}

const DEFAULT_INSIGHT_TYPE = "weekly_summary";
const DEFAULT_PERIOD_TYPE: InsightPeriodType = "weekly";
const DEFAULT_KEY_METRIC = "Insight financeiro atualizado";
const DEFAULT_CONTENT = "Seu insight financeiro esta disponivel para leitura.";
const INSIGHT_STATUSES = new Set<InsightStatus>(["pending", "delivered", "read"]);
const PERIOD_TYPES = new Set<InsightPeriodType>(["daily", "weekly", "monthly", "recap"]);

const pickString = (value: unknown, fallback = ""): string => {
  return typeof value === "string" && value.trim().length > 0 ? value : fallback;
};

const pickNullableString = (value: unknown): string | null => {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
};

const pickNumber = (value: unknown): number | null => {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
};

const pickBoolean = (value: unknown): boolean | null => {
  return typeof value === "boolean" ? value : null;
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return value !== null && typeof value === "object" && !Array.isArray(value);
};

const mapStatus = (status: string): InsightStatus => {
  return INSIGHT_STATUSES.has(status as InsightStatus) ? (status as InsightStatus) : "delivered";
};

const mapPeriodType = (periodType: string | null | undefined): InsightPeriodType => {
  return PERIOD_TYPES.has(periodType as InsightPeriodType)
    ? (periodType as InsightPeriodType)
    : DEFAULT_PERIOD_TYPE;
};

const mapSummary = (summary: unknown): InsightSummary | null => {
  return isRecord(summary) ? summary : null;
};

const mapEvidence = (evidence: unknown): readonly string[] | undefined => {
  if (!Array.isArray(evidence)) {
    return undefined;
  }

  const values = evidence.filter(
    (entry): entry is string => typeof entry === "string" && entry.trim().length > 0,
  );
  return values.length > 0 ? values : undefined;
};

const mapInsightItem = (value: unknown): InsightItem | null => {
  if (!isRecord(value)) {
    return null;
  }

  const type = pickString(value.type);
  const title = pickString(value.title);
  const message = pickString(value.message);

  if (!type || !title || !message) {
    return null;
  }

  const evidence = mapEvidence(value.evidence);
  return evidence ? { type, title, message, evidence } : { type, title, message };
};

const parseContentItems = (content: string): readonly InsightItem[] => {
  try {
    const parsed = JSON.parse(content) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.map(mapInsightItem).filter((item): item is InsightItem => item !== null);
  } catch {
    return [];
  }
};

const mapInsightItems = (payload: UserInsightPayload, content: string): readonly InsightItem[] => {
  const directItems = Array.isArray(payload.items)
    ? payload.items.map(mapInsightItem).filter((item): item is InsightItem => item !== null)
    : [];
  if (directItems.length > 0) {
    return directItems;
  }

  const parsedItems = parseContentItems(content);
  if (parsedItems.length > 0) {
    return parsedItems;
  }

  return [
    {
      type: DEFAULT_INSIGHT_TYPE,
      title: pickString(payload.key_metric, DEFAULT_KEY_METRIC),
      message: content || DEFAULT_CONTENT,
    },
  ];
};

const getSummaryHeadline = (summary: InsightSummary | null): string => {
  const headline = summary?.headline;
  return typeof headline === "string" && headline.trim().length > 0 ? headline : "";
};

const resolvePeriodLabel = (payload: UserInsightPayload): string => {
  const explicitLabel = pickString(payload.period_label);
  if (explicitLabel) {
    return explicitLabel;
  }

  const start = pickString(payload.period_start).slice(0, 10);
  const end = pickString(payload.period_end).slice(0, 10);
  return start && end ? `${start} a ${end}` : "Semana atual";
};

const mapInsight = (payload: UserInsightPayload): UserInsight => {
  const content = pickString(payload.content);
  const summary = mapSummary(payload.summary);
  const items = mapInsightItems(payload, content);
  const firstItem = items[0];
  const keyMetric =
    pickString(payload.key_metric) ||
    getSummaryHeadline(summary) ||
    firstItem?.title ||
    DEFAULT_KEY_METRIC;

  return {
    id: payload.id,
    content: content || firstItem?.message || DEFAULT_CONTENT,
    keyMetric,
    items,
    summary,
    periodType: mapPeriodType(payload.period_type),
    periodLabel: resolvePeriodLabel(payload),
    periodStart: payload.period_start,
    periodEnd: payload.period_end,
    status: mapStatus(payload.status),
    generatedAt: pickString(payload.generated_at, pickString(payload.created_at)),
    readAt: payload.read_at,
    metadata: {
      model: pickNullableString(payload.model),
      tokensUsed: pickNumber(payload.tokens_used),
      costUsd: pickNumber(payload.cost_usd),
      cached: pickBoolean(payload.cached),
      contextVersion: pickNullableString(payload.context_version),
    },
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
