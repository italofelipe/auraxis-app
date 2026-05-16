export type InsightStatus = "pending" | "delivered" | "read";

export interface UserInsight {
  readonly id: string;
  readonly content: string;
  readonly keyMetric: string;
  readonly periodStart: string;
  readonly periodEnd: string;
  readonly status: InsightStatus;
  readonly generatedAt: string;
  readonly readAt: string | null;
}

export interface LatestInsightResponse {
  readonly insight: UserInsight | null;
}
