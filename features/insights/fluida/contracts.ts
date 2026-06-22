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
 * Direction of a comparative figure, driving its colour: `pos` (money in /
 * improvement → green), `neg` (money out / regression → red) and `neutral`
 * (no movement → muted). Decoupled from {@link InsightSeverity}: a negative
 * sign is not necessarily an alert, it is just an outflow.
 */
export type InsightSign = "pos" | "neg" | "neutral";

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
 * One comparative card of the "Como se compara" beat (etapa 2). Mirrors the
 * `retro[]` entries of the design mock: a key, an uppercase label
 * ("Ontem · 20 jun"), a signed BRL `value`, a short caption and the `sign`
 * that colours the value.
 */
export interface InsightRetroItem {
  readonly key: "yesterday" | "daybefore" | "vs_week";
  readonly label: string;
  /** BRL amount; its own sign carries no colour — {@link sign} does. */
  readonly value: number;
  readonly caption: string;
  readonly sign: InsightSign;
}

/**
 * A numeric highlight tile / pull-stat (etapa 2): a short label, a value and
 * a one-line sub-caption. `value` is a string so the mock can carry either a
 * BRL figure ("R$ 11.000,00") or a percentage ("55%") verbatim — the real
 * backend will format these the same way.
 */
export interface InsightHighlight {
  readonly label: string;
  readonly value: string;
  readonly sub: string;
}

/**
 * Outflow series feeding the "O ritmo de saídas" chart (etapa 2): seven
 * daily figures or six weekly figures, in chronological order (oldest →
 * newest). Values are BRL amounts of money that left the account.
 */
export interface InsightSeries {
  /** Last 7 days of outflow (chronological). */
  readonly daily: readonly number[];
  /** Last 6 weeks of outflow (chronological). */
  readonly weekly: readonly number[];
}

/**
 * Full view model for the "Fluida" reading (etapa 2). Extends the lead with
 * the editorial body (`paragraphs`), the comparative cards (`retro`, only
 * meaningful for the `general` dimension), the numeric highlights
 * (`highlights`) and the outflow `series` for the chart. The closing beats
 * (attention list, "where to go next", AI provenance) land in etapa 3.
 */
export interface InsightFluidaVM extends InsightLeadVM {
  /** Body paragraphs of the reading, in order. */
  readonly paragraphs: readonly string[];
  /** Comparative cards; empty for non-general dimensions. */
  readonly retro: readonly InsightRetroItem[];
  /** Numeric highlight tiles / pull-stats. */
  readonly highlights: readonly InsightHighlight[];
  /** Daily/weekly outflow series for the rhythm chart. */
  readonly series: InsightSeries;
}

/**
 * Canonical order of the cadence toggle in the masthead.
 */
export const INSIGHT_CADENCE_ORDER: readonly InsightCadence[] = ["daily", "weekly"];
