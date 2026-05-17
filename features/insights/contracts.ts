export type InsightStatus = "pending" | "delivered" | "read";
export type InsightPeriodType = "daily" | "weekly" | "monthly" | "recap";

export interface InsightItem {
  readonly type: string;
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
