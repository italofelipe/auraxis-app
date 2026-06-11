/**
 * Contracts for the premium AI weekly-summary narrative
 * (`GET /ai/insights/weekly-summary`, parity with web UX-02-1 / #561).
 *
 * The endpoint is premium-gated (entitlement `advanced_simulations`). The
 * dashboard card reads the narrative plus current-week totals and the
 * week-over-week deltas, and uses a stable content signature to drive the
 * "NOVO" badge.
 */

export interface WeeklyPeriodTotalsPayload {
  readonly start: string;
  readonly end: string;
  readonly income: number;
  readonly expense: number;
  readonly balance: number;
  readonly transaction_count: number;
}

export interface WeeklyComparisonPayload {
  readonly income_delta: number;
  readonly income_delta_percent: number;
  readonly expense_delta: number;
  readonly expense_delta_percent: number;
  readonly balance_delta: number;
  readonly balance_delta_percent: number;
}

export interface WeeklySummaryPayload {
  readonly current_week: WeeklyPeriodTotalsPayload;
  readonly previous_week: WeeklyPeriodTotalsPayload;
  readonly comparison: WeeklyComparisonPayload;
}

export interface WeeklySummaryNarrativeResponse {
  readonly narrative: string;
  readonly tokens_used?: number;
  readonly cost_usd?: number;
  readonly model?: string;
  readonly summary: WeeklySummaryPayload;
}

/** Compact view model for the dashboard weekly-snapshot card. */
export interface WeeklySnapshot {
  readonly narrative: string;
  readonly weekStart: string;
  readonly weekEnd: string;
  readonly currentIncome: number;
  readonly currentExpense: number;
  readonly currentBalance: number;
  readonly transactionCount: number;
  readonly expenseDeltaPercent: number;
  readonly balanceDeltaPercent: number;
}
