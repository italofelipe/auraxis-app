import type { InsightSectionSeverity } from "@/shared/insights/insight-section-contracts";

/**
 * Visual descriptor for the compact section severity chip. `colorToken` drives
 * the text/dot colour and `tintToken` the chip background — both are Tamagui
 * theme tokens so light/dark resolve automatically and nothing is hardcoded at
 * the call site.
 *
 * Self-contained in `shared/insights` (it mirrors the Fluida severity visual)
 * so this shared module owns no dependency on `features/insights`.
 */
export interface SectionSeverityVisual {
  readonly label: string;
  readonly colorToken: `$${string}`;
  readonly tintToken: `$${string}`;
}

const SECTION_SEVERITY_VISUALS: Record<
  InsightSectionSeverity,
  SectionSeverityVisual
> = {
  ok: { label: "Tudo certo", colorToken: "$success", tintToken: "$successSubtle" },
  attention: {
    label: "Atenção",
    colorToken: "$warning",
    tintToken: "$warningSubtle",
  },
  alert: { label: "Alerta", colorToken: "$danger", tintToken: "$dangerSubtle" },
};

/**
 * Resolves the colour/tint/label triple used to render the section severity
 * chip.
 *
 * @param severity Editorial severity of the recorte.
 * @returns Theme-token-based visual descriptor for the chip.
 */
export const resolveSectionSeverityVisual = (
  severity: InsightSectionSeverity,
): SectionSeverityVisual => {
  return SECTION_SEVERITY_VISUALS[severity];
};
