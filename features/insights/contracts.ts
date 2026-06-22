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

/**
 * Direction of a comparative figure as emitted by the backend: `pos`
 * (favourable / less spending), `neg` (unfavourable / more spending) and
 * `neutral` (no movement). Structurally identical to the Fluida `InsightSign`;
 * redeclared here so this contract owns no dependency on the `fluida/` surface
 * (the dependency arrow points fluida → contracts, never the reverse).
 */
export type InsightRetroSign = "pos" | "neg" | "neutral";

/**
 * One calculated retrospective metric of the structured "Fluida" payload
 * (backend PR #1502, additive). Belongs to the `general` dimension. `value` is
 * a **decimal amount** (a raw number, not a formatted string) — the Fluida
 * mapper formats it for display.
 */
export interface InsightRetroEntry {
  readonly key: string;
  readonly label: string;
  readonly value: number;
  readonly caption: string;
  readonly sign: InsightRetroSign;
}

/**
 * Outflow series of the structured "Fluida" payload: daily figures over the
 * last 7 days and weekly figures over the last 6 weeks, oldest → newest. Both
 * are raw decimal amounts.
 */
export interface InsightSeriesData {
  readonly daily: readonly number[];
  readonly weekly: readonly number[];
}

/**
 * One per-theme numeric highlight of the structured "Fluida" payload. `value`
 * is a **decimal amount** (a raw number) — distinct from the Fluida VM's
 * `InsightHighlight`, whose `value` is a preformatted string.
 */
export interface InsightHighlightData {
  readonly label: string;
  readonly value: number;
  readonly sub: string;
}

/**
 * Editorial severity of an insight lead as emitted by the backend (REST
 * field `severity`): `ok`, `attention` or `alert`. Structurally identical to
 * the Fluida `InsightSeverity`; redeclared here so this contract owns no
 * dependency on the `fluida/` surface (the dependency arrow points
 * fluida → contracts, never the reverse).
 */
export type InsightLeadSeverity = "ok" | "attention" | "alert";

/**
 * Editorial **lead** of an insight (backend PR #1508, additive). Mirrors the
 * backend `InsightLeadVM` — the opening beat of the "Fluida" reading: a
 * severity, a serif headline (`title`), the opening paragraph (`lead`), the
 * estimated reading time (`readMinutes`, REST `read_min`) and the "where to go
 * next" call to action (`nextStep`, REST `next_step`).
 *
 * Optional on {@link UserInsight} and absence-safe: legacy insights (and
 * endpoints not yet enriched) omit it, in which case the Fluida mapper falls
 * back to the editorial mock.
 */
export interface InsightLead {
  readonly severity: InsightLeadSeverity;
  readonly title: string;
  readonly lead: string;
  readonly readMinutes: number;
  readonly nextStep: string;
}

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
  /**
   * Structured "Fluida" fields (backend PR #1502 — additive). Each is optional
   * and may be absent on older insights or endpoints not yet enriched, so the
   * mobile mapper must stay absence-safe. Present, they feed the editorial
   * "Fluida" reading directly.
   *
   * `lead` — editorial lead (severity/title/lead/reading time/next step;
   *   backend PR #1508). Drives the Fluida reading's opening beat directly.
   * `paragraphs` — AI prose split into short paragraphs.
   * `retro` — outflow retrospective (the `general` dimension only).
   * `series` — daily/weekly outflow series for the rhythm chart.
   * `highlights` — per-theme numeric highlights (raw decimal amounts).
   */
  readonly lead?: InsightLead;
  readonly paragraphs?: readonly string[];
  readonly retro?: readonly InsightRetroEntry[];
  readonly series?: InsightSeriesData;
  readonly highlights?: readonly InsightHighlightData[];
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
