import type { InsightDimension, UserInsight } from "@/features/insights/contracts";
import type {
  InsightFluidaVM,
  InsightHighlight,
  InsightRetroItem,
  InsightSeries,
} from "@/features/insights/fluida/contracts";
import { selectFluidaVM } from "@/features/insights/mocks/fluida-vm";
import type { SelectFluidaLeadParams } from "@/features/insights/mocks/fluida-lead";
import { formatCurrency } from "@/shared/utils/formatters";

/**
 * The only dimension whose comparative ("Como se compara") beat is meaningful.
 * The backend computes `retro` for the overall account (the `general`
 * dimension); the per-theme recortes have no retrospective of their own, so
 * the mapper drops `retro` for every other dimension — mirroring the
 * `showCompare` rule in the screen controller.
 */
export const INSIGHT_FLUIDA_RETRO_DIMENSION: InsightDimension = "general";

/**
 * Maps the backend's numeric highlights onto the VM, formatting each value as a
 * BRL string. The structured contract carries `value` as a decimal **number**
 * (the ledger amount), whereas the VM (and the mock) carry it as a preformatted
 * string so the surface can render BRL or percentages verbatim — here every
 * real highlight is a currency amount.
 */
const mapHighlights = (
  highlights: readonly UserInsightHighlight[] | undefined,
): readonly InsightHighlight[] => {
  if (!highlights || highlights.length === 0) {
    return [];
  }
  return highlights.map((highlight) => ({
    label: highlight.label,
    value: formatCurrency(highlight.value),
    sub: highlight.sub,
  }));
};

/**
 * Keys the comparative ("Como se compara") beat understands, matching the
 * backend `build_retro` contract. Entries with an unrecognised key are dropped
 * so the VM's narrow `InsightRetroItem.key` union stays sound.
 */
const RETRO_VM_KEYS = new Set<InsightRetroItem["key"]>([
  "yesterday",
  "daybefore",
  "vs_week",
]);

const isRetroVMKey = (key: string): key is InsightRetroItem["key"] => {
  return RETRO_VM_KEYS.has(key as InsightRetroItem["key"]);
};

/**
 * Selects the comparative cards for a dimension: the real `retro` entries on
 * the `general` dimension (`value` stays numeric; the key is narrowed onto the
 * VM's known set, unknown keys dropped), an empty list everywhere else.
 */
const mapRetro = (
  insight: UserInsight,
  dimension: InsightDimension,
): readonly InsightRetroItem[] => {
  if (dimension !== INSIGHT_FLUIDA_RETRO_DIMENSION) {
    return [];
  }
  return (insight.retro ?? [])
    .filter((entry) => isRetroVMKey(entry.key))
    .map((entry) => ({
      key: entry.key as InsightRetroItem["key"],
      label: entry.label,
      value: entry.value,
      caption: entry.caption,
      sign: entry.sign,
    }));
};

/**
 * Whether a series object actually carries both arrays the chart needs. Guards
 * against a partially-populated payload (e.g. one array missing) being treated
 * as renderable.
 */
const hasUsableSeries = (series: InsightSeries | undefined): series is InsightSeries => {
  return (
    series !== undefined &&
    Array.isArray(series.daily) &&
    Array.isArray(series.weekly)
  );
};

/**
 * A real insight is rich enough to drive the reading when it carries either the
 * editorial prose (`paragraphs`) or the outflow `series` (the chart). Highlights
 * or retro alone are not enough — without prose or a chart the reading would be
 * half-empty, so the mapper prefers the fully-authored mock in that case.
 */
const hasUsableBody = (insight: UserInsight): boolean => {
  const hasParagraphs =
    Array.isArray(insight.paragraphs) && insight.paragraphs.length > 0;
  return hasParagraphs || hasUsableSeries(insight.series);
};

/**
 * Derives the full "Fluida" reading VM for a dimension × cadence from a **real**
 * insight, falling back to the mock fixture when the insight is absent or lacks
 * the structured payload.
 *
 * Fallback rule (ausência-safe — the screen is never empty):
 * - `insight === null` (no insight yet / backend 404) ⇒ mock.
 * - insight present but with neither `paragraphs` nor `series` (legacy backend,
 *   additive fields not yet shipped) ⇒ mock.
 * - otherwise ⇒ real reading: the editorial **lead** (severity, headline,
 *   opening lead, reading time) is taken from the mock recorte for the
 *   dimension/cadence (the backend supplies prose + numbers, not the per-theme
 *   editorial framing), while `paragraphs`, `series`, `highlights` and `retro`
 *   come from the insight.
 *
 * Pure and side-effect free — safe to unit test and to call inside a `useMemo`.
 *
 * @param insight The real insight (or `null` when none is loaded).
 * @param params Active dimension and cadence.
 * @returns The Fluida VM, from the real payload or the mock fallback.
 */
export const insightToFluidaVM = (
  insight: UserInsight | null | undefined,
  params: SelectFluidaLeadParams,
): InsightFluidaVM => {
  const mock = selectFluidaVM(params);

  if (!insight || !hasUsableBody(insight)) {
    return mock;
  }

  const series = hasUsableSeries(insight.series) ? insight.series : mock.series;

  return {
    dimension: mock.dimension,
    cadence: mock.cadence,
    severity: mock.severity,
    title: mock.title,
    lead: mock.lead,
    readMinutes: mock.readMinutes,
    paragraphs: insight.paragraphs ?? [],
    retro: mapRetro(insight, params.dimension),
    highlights: mapHighlights(insight.highlights),
    series,
  };
};

/**
 * Re-exported here for the mapper's own typing convenience; the canonical
 * declaration lives in `features/insights/contracts`.
 */
type UserInsightHighlight = NonNullable<UserInsight["highlights"]>[number];
