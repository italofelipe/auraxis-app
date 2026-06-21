import type { InsightDimension } from "@/features/insights/contracts";

/**
 * Cadence of the "Fluida" AI insight reading: the editorial digest is
 * generated either every day or once a week. Mirrors the backend
 * generation period (`daily` | `weekly`) — the monthly/recap variants of
 * the legacy contract are out of scope for this surface.
 */
export type InsightCadence = "daily" | "weekly";

/**
 * Editorial severity of a lead. Drives the severity chip colour/label:
 * `ok` (green), `attention` (amber) and `alert` (red).
 */
export type InsightSeverity = "ok" | "attention" | "alert";

/**
 * View model for the editorial **lead** of the "Fluida" insights screen
 * (etapa 1). It is the opening beat of the reading: a kicker (theme name),
 * a severity chip, a reading-time badge, a serif headline and the opening
 * paragraph. Later beats (comparatives, chart, pull-stat, attention list,
 * "where to go next", AI provenance) extend this contract in subsequent
 * stages and are intentionally absent here.
 */
export interface InsightLeadVM {
  readonly dimension: InsightDimension;
  readonly cadence: InsightCadence;
  readonly severity: InsightSeverity;
  /** Headline rendered in the serif (Newsreader) face. */
  readonly title: string;
  /** Opening paragraph of the reading (Inter face). */
  readonly lead: string;
  /** Estimated reading time, in whole minutes, for this section. */
  readonly readMinutes: number;
}

/**
 * Canonical order of the cadence toggle in the masthead.
 */
export const INSIGHT_CADENCE_ORDER: readonly InsightCadence[] = ["daily", "weekly"];
