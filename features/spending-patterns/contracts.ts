/**
 * Contracts for the spending-patterns radar (parity with web PROD-04 / #568).
 *
 * The app reads the cron-generated analysis from
 * `GET /ai/insights/spending-patterns/latest` (read-only, quota-free) and can
 * trigger an on-demand detection via `POST /ai/insights/spending-patterns`
 * with LGPD-safe transaction inputs (amount/date/coarse label only).
 */

export type SpendingPatternSeverity = "low" | "medium" | "high";

/** LGPD-safe transaction input forwarded to the detection endpoint. */
export interface SpendingPatternTransactionInput {
  readonly amount: number;
  readonly occurredOn: string;
  readonly category?: string;
  readonly kind: "expense" | "income";
}

/** Wire shape of a single detected pattern. */
export interface SpendingPatternPayload {
  readonly description: string;
  readonly frequency: string;
  readonly average_value: number;
  readonly suggested_action: string;
  readonly severity: SpendingPatternSeverity;
}

export interface SpendingPatternsDetectResponse {
  readonly patterns: readonly SpendingPatternPayload[];
  readonly model: string;
  readonly generated_count: number;
}

export interface SpendingPatternsLatestResponse {
  readonly patterns: readonly SpendingPatternPayload[];
  readonly generated_at: string | null;
  readonly period_label: string | null;
  readonly model: string;
  readonly cost_usd: number;
  readonly tokens_used: number;
}

/** Domain view of a detected spending pattern. */
export interface SpendingPattern {
  readonly description: string;
  readonly frequency: string;
  readonly averageValue: number;
  readonly suggestedAction: string;
  readonly severity: SpendingPatternSeverity;
}

/** Cached radar view model read from the quota-free endpoint. */
export interface SpendingPatternsLatest {
  readonly patterns: readonly SpendingPattern[];
  readonly generatedAt: string | null;
  readonly periodLabel: string | null;
}

export interface DetectSpendingPatternsCommand {
  readonly transactions: readonly SpendingPatternTransactionInput[];
  readonly periodDays?: number;
}

/** Wire-level request body for the detection endpoint. */
export interface SpendingPatternsDetectCommand {
  readonly transactions: readonly {
    readonly amount: number;
    readonly occurred_on: string;
    readonly category?: string;
    readonly kind: "expense" | "income";
  }[];
  readonly period_days: number;
}
