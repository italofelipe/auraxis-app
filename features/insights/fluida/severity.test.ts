import type { InsightSeverity } from "@/features/insights/fluida/contracts";
import {
  INSIGHT_SEVERITY_LABELS,
  getInsightSeverityLabel,
  resolveSeverityVisual,
} from "@/features/insights/fluida/severity";

describe("insight severity mapping", () => {
  it("maps ok to a green/success token and 'Tudo certo' label", () => {
    const visual = resolveSeverityVisual("ok");

    expect(visual.label).toBe("Tudo certo");
    expect(visual.colorToken).toBe("$success");
    expect(visual.tintToken).toBe("$successSubtle");
  });

  it("maps attention to a warning token and 'Atenção' label", () => {
    const visual = resolveSeverityVisual("attention");

    expect(visual.label).toBe("Atenção");
    expect(visual.colorToken).toBe("$warning");
    expect(visual.tintToken).toBe("$warningSubtle");
  });

  it("maps alert to a danger token and 'Alerta' label", () => {
    const visual = resolveSeverityVisual("alert");

    expect(visual.label).toBe("Alerta");
    expect(visual.colorToken).toBe("$danger");
    expect(visual.tintToken).toBe("$dangerSubtle");
  });

  it("exposes a label for every severity via the lookup helper", () => {
    const severities: readonly InsightSeverity[] = ["ok", "attention", "alert"];

    severities.forEach((severity) => {
      expect(getInsightSeverityLabel(severity)).toBe(
        INSIGHT_SEVERITY_LABELS[severity],
      );
      expect(getInsightSeverityLabel(severity).length).toBeGreaterThan(0);
    });
  });
});
