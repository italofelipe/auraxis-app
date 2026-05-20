export type InsightStatus = "pending" | "delivered" | "read";
export type InsightPeriodType = "daily" | "weekly" | "monthly" | "recap";
export type InsightGenerationPeriodType = "daily" | "weekly" | "monthly";
export type InsightDimension =
  | "general"
  | "transactions"
  | "credit_cards"
  | "goals"
  | "budgets";

export interface InsightItem {
  readonly type: string;
  readonly dimension?: InsightDimension;
  readonly title: string;
  readonly message: string;
  readonly evidence?: readonly string[];
}

export type InsightSummary = Readonly<Record<string, unknown>>;

export interface InsightMetadata {
  readonly model: string | null;
  readonly tokensUsed: number | null;
  readonly costUsd: number | null;
  readonly cached: boolean | null;
  readonly contextVersion: string | null;
}

export interface UserInsight {
  readonly id: string;
  readonly content: string;
  readonly keyMetric: string;
  readonly items: readonly InsightItem[];
  readonly summary: InsightSummary | null;
  readonly periodType: InsightPeriodType;
  readonly periodLabel: string;
  readonly periodStart: string;
  readonly periodEnd: string;
  readonly status: InsightStatus;
  readonly generatedAt: string;
  readonly readAt: string | null;
  readonly metadata: InsightMetadata;
}

export interface LatestInsightResponse {
  readonly insight: UserInsight | null;
}

export interface GenerateInsightCommand {
  readonly periodType: InsightGenerationPeriodType;
  readonly anchorDate?: string;
}

export interface GeneratedInsightResponse {
  readonly insight: UserInsight;
  readonly callsRemaining: number | null;
}

export interface InsightHistoryQuery {
  readonly page?: number;
  readonly perPage?: number;
}

export interface InsightHistoryResponse {
  readonly items: readonly UserInsight[];
  readonly page: number;
  readonly perPage: number;
  readonly total: number;
}
