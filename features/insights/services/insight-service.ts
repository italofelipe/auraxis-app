import type { AxiosInstance } from "axios";

import { ApiError } from "@/core/http/api-error";
import { unwrapEnvelopeData } from "@/core/http/contracts";
import { httpClient } from "@/core/http/http-client";
import type {
  GeneratedInsightResponse,
  GenerateInsightCommand,
  InsightDimension,
  InsightHistoryQuery,
  InsightHistoryResponse,
  InsightItem,
  InsightGenerationPeriodType,
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
  readonly insight_type?: string | null;
  readonly period_type?: string | null;
  readonly period_label?: string | null;
  readonly period_start?: string | null;
  readonly period_end?: string | null;
  readonly status?: string | null;
  readonly generated_at?: string | null;
  readonly created_at?: string | null;
  readonly read_at?: string | null;
  readonly model?: string | null;
  readonly tokens_used?: number | null;
  readonly cost_usd?: number | null;
  readonly cached?: boolean | null;
  readonly context_version?: string | null;
  readonly context_schema_version?: string | null;
}

interface GeneratedInsightPayload {
  readonly summary?: string | null;
  readonly items?: unknown;
  readonly period_type?: string | null;
  readonly period_label?: string | null;
  readonly period_start?: string | null;
  readonly period_end?: string | null;
  readonly context_version?: string | null;
  readonly context_hash?: string | null;
  readonly model?: string | null;
  readonly tokens_used?: number | null;
  readonly cost_usd?: number | null;
  readonly cached?: boolean | null;
  readonly generated_at?: string | null;
  readonly created_at?: string | null;
}

interface InsightHistoryPayload {
  readonly items?: unknown;
  readonly page?: number | null;
  readonly per_page?: number | null;
  readonly total?: number | null;
}

const DEFAULT_INSIGHT_TYPE = "weekly_summary";
const DEFAULT_PERIOD_TYPE: InsightPeriodType = "weekly";
const DEFAULT_KEY_METRIC = "Insight financeiro atualizado";
const DEFAULT_CONTENT = "Seu insight financeiro esta disponivel para leitura.";
const INSIGHT_STATUSES = new Set<InsightStatus>(["pending", "delivered", "read"]);
const PERIOD_TYPES = new Set<InsightPeriodType>(["daily", "weekly", "monthly", "recap"]);
const GENERATION_PERIOD_TYPES = new Set<InsightGenerationPeriodType>([
  "daily",
  "weekly",
  "monthly",
]);
const INSIGHT_DIMENSIONS = new Set<InsightDimension>([
  "general",
  "transactions",
  "credit_cards",
  "goals",
  "budgets",
]);

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

const pickPositiveNumber = (value: unknown, fallback: number): number => {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : fallback;
};

const pickNonNegativeNumber = (value: unknown, fallback: number): number => {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : fallback;
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return value !== null && typeof value === "object" && !Array.isArray(value);
};

const mapStatus = (status: string | null | undefined): InsightStatus => {
  return INSIGHT_STATUSES.has(status as InsightStatus) ? (status as InsightStatus) : "delivered";
};

const mapPeriodType = (periodType: string | null | undefined): InsightPeriodType => {
  return PERIOD_TYPES.has(periodType as InsightPeriodType)
    ? (periodType as InsightPeriodType)
    : DEFAULT_PERIOD_TYPE;
};

const mapGenerationPeriodType = (
  periodType: string | null | undefined,
): InsightGenerationPeriodType => {
  return GENERATION_PERIOD_TYPES.has(periodType as InsightGenerationPeriodType)
    ? (periodType as InsightGenerationPeriodType)
    : "daily";
};

const mapSummary = (summary: unknown): InsightSummary | null => {
  if (isRecord(summary)) {
    return summary;
  }
  if (typeof summary === "string" && summary.trim().length > 0) {
    return { headline: summary };
  }
  return null;
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

const mapDimension = (dimension: unknown): InsightDimension => {
  return INSIGHT_DIMENSIONS.has(dimension as InsightDimension)
    ? (dimension as InsightDimension)
    : "general";
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
  const base = { type, dimension: mapDimension(value.dimension), title, message };
  return evidence ? { ...base, evidence } : base;
};

const stripMarkdownJsonFence = (content: string): string => {
  const trimmed = content.trim();
  if (!trimmed.startsWith("```")) {
    return trimmed;
  }

  const openingLineEnd = trimmed.indexOf("\n");
  const closingFenceStart = trimmed.lastIndexOf("```");
  if (openingLineEnd === -1 || closingFenceStart <= openingLineEnd) {
    return trimmed;
  }

  const language = trimmed.slice(3, openingLineEnd).trim().toLowerCase();
  if (language && language !== "json") {
    return trimmed;
  }

  return trimmed.slice(openingLineEnd + 1, closingFenceStart).trim();
};

const mapInsightItemsArray = (items: unknown): readonly InsightItem[] => {
  return Array.isArray(items)
    ? items.map(mapInsightItem).filter((item): item is InsightItem => item !== null)
    : [];
};

const parseContentItems = (content: string): readonly InsightItem[] => {
  try {
    const parsed = JSON.parse(stripMarkdownJsonFence(content)) as unknown;
    if (Array.isArray(parsed)) {
      return mapInsightItemsArray(parsed);
    }
    if (isRecord(parsed)) {
      return mapInsightItemsArray(parsed.items);
    }
    return [];
  } catch {
    return [];
  }
};

const mapInsightItems = (payload: UserInsightPayload, content: string): readonly InsightItem[] => {
  const directItems = mapInsightItemsArray(payload.items);
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
      dimension: "general",
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

const resolveContextVersion = (payload: UserInsightPayload): string | null => {
  return (
    pickNullableString(payload.context_version) ??
    pickNullableString(payload.context_schema_version)
  );
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
    periodType: mapPeriodType(payload.period_type ?? payload.insight_type),
    periodLabel: resolvePeriodLabel(payload),
    periodStart: pickString(payload.period_start),
    periodEnd: pickString(payload.period_end),
    status: mapStatus(payload.status),
    generatedAt: pickString(payload.generated_at, pickString(payload.created_at)),
    readAt: pickNullableString(payload.read_at),
    metadata: {
      model: pickNullableString(payload.model),
      tokensUsed: pickNumber(payload.tokens_used),
      costUsd: pickNumber(payload.cost_usd),
      cached: pickBoolean(payload.cached),
      contextVersion: resolveContextVersion(payload),
    },
  };
};

const mapGeneratedPayload = (payload: GeneratedInsightPayload): UserInsight => {
  const periodType = mapGenerationPeriodType(payload.period_type);
  const periodLabel = pickString(payload.period_label, "Periodo atual");
  const summary = mapSummary(payload.summary);
  const items = mapInsightItemsArray(payload.items);
  const content = pickString(payload.summary, items[0]?.message ?? DEFAULT_CONTENT);

  return {
    id: pickString(payload.context_hash, `${periodType}-${periodLabel}`),
    content,
    keyMetric:
      getSummaryHeadline(summary) ||
      items[0]?.title ||
      DEFAULT_KEY_METRIC,
    items: items.length > 0
      ? items
      : [
          {
            type: DEFAULT_INSIGHT_TYPE,
            dimension: "general",
            title: DEFAULT_KEY_METRIC,
            message: content,
          },
        ],
    summary,
    periodType,
    periodLabel,
    periodStart: pickString(payload.period_start),
    periodEnd: pickString(payload.period_end),
    status: "delivered",
    generatedAt: pickString(
      payload.generated_at,
      pickString(payload.created_at, pickString(payload.period_end)),
    ),
    readAt: null,
    metadata: {
      model: pickNullableString(payload.model),
      tokensUsed: pickNumber(payload.tokens_used),
      costUsd: pickNumber(payload.cost_usd),
      cached: pickBoolean(payload.cached),
      contextVersion: pickNullableString(payload.context_version),
    },
  };
};

const mapHistoryPayload = (
  payload: InsightHistoryPayload,
  query: Required<InsightHistoryQuery>,
): InsightHistoryResponse => {
  const items = Array.isArray(payload.items)
    ? payload.items
        .filter(isRecord)
        .map((item) => mapInsight(item as unknown as UserInsightPayload))
    : [];

  return {
    items,
    page: pickPositiveNumber(payload.page, query.page),
    perPage: pickPositiveNumber(payload.per_page, query.perPage),
    total: pickNonNegativeNumber(payload.total, items.length),
  };
};

const parseCallsRemaining = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const isNotFoundError = (error: unknown): boolean => {
  return error instanceof ApiError && error.status === 404;
};

export const createInsightService = (client: AxiosInstance) => {
  return {
    generate: async (
      command: GenerateInsightCommand,
    ): Promise<GeneratedInsightResponse> => {
      const response = await client.post(apiContractMap.aiInsightGenerate.path, {
        period_type: command.periodType,
        ...(command.anchorDate ? { anchor_date: command.anchorDate } : {}),
      });
      const payload = unwrapEnvelopeData<GeneratedInsightPayload>(response.data);
      return {
        insight: mapGeneratedPayload(payload),
        callsRemaining: parseCallsRemaining(response.headers?.["x-ai-calls-remaining"]),
      };
    },
    history: async (
      query: InsightHistoryQuery = {},
    ): Promise<InsightHistoryResponse> => {
      const resolvedQuery = {
        page: query.page ?? 1,
        perPage: query.perPage ?? 20,
      };
      const response = await client.get(apiContractMap.aiInsightHistory.path, {
        params: {
          page: resolvedQuery.page,
          per_page: resolvedQuery.perPage,
        },
      });
      const payload = unwrapEnvelopeData<InsightHistoryPayload>(response.data);
      return mapHistoryPayload(payload, resolvedQuery);
    },
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
