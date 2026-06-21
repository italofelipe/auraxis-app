import type { InsightSeverity } from "@/features/insights/fluida/contracts";

/**
 * Human-readable label shown inside the severity chip for each editorial
 * severity level. Portuguese copy, matching the design handoff.
 */
export const INSIGHT_SEVERITY_LABELS: Record<InsightSeverity, string> = {
  ok: "Tudo certo",
  attention: "Atenção",
  alert: "Alerta",
};

/**
 * Visual descriptor for a severity chip. `colorToken` drives the
 * text/icon colour and `tintToken` the chip background — both are Tamagui
 * theme tokens so light/dark resolve automatically and nothing is
 * hardcoded at the call site.
 */
export interface SeverityVisual {
  readonly label: string;
  readonly colorToken: `$${string}`;
  readonly tintToken: `$${string}`;
}

const SEVERITY_VISUALS: Record<InsightSeverity, SeverityVisual> = {
  ok: {
    label: INSIGHT_SEVERITY_LABELS.ok,
    colorToken: "$success",
    tintToken: "$successSubtle",
  },
  attention: {
    label: INSIGHT_SEVERITY_LABELS.attention,
    colorToken: "$warning",
    tintToken: "$warningSubtle",
  },
  alert: {
    label: INSIGHT_SEVERITY_LABELS.alert,
    colorToken: "$danger",
    tintToken: "$dangerSubtle",
  },
};

/**
 * Returns the chip label for a given severity.
 *
 * @param severity Editorial severity of the lead.
 * @returns Localised severity label.
 */
export const getInsightSeverityLabel = (severity: InsightSeverity): string => {
  return INSIGHT_SEVERITY_LABELS[severity];
};

/**
 * Resolves the colour/tint/label triple used to render a severity chip.
 *
 * @param severity Editorial severity of the lead.
 * @returns Theme-token-based visual descriptor for the chip.
 */
export const resolveSeverityVisual = (severity: InsightSeverity): SeverityVisual => {
  return SEVERITY_VISUALS[severity];
};
