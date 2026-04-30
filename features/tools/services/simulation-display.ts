import type { SimulationRecord } from "@/features/tools/contracts";

const TOOL_LABELS: Readonly<Record<string, string>> = {
  "installment-vs-cash": "Parcelado vs à vista",
  installment_vs_cash: "Parcelado vs à vista",
  "compound-interest": "Juros compostos",
  "cdb-lci-lca": "CDB · LCI · LCA",
  "salary-simulator": "Simulador de salário",
  "goal-simulator": "Simulador de meta",
  "salary-net-clt": "Salário líquido CLT",
  "inss-ir-payroll": "INSS e IR na folha",
  "thirteenth-salary": "13º salário",
  overtime: "Hora extra",
  "mei-monthly": "MEI mensal",
  "clt-vs-pj": "CLT vs PJ",
  termination: "Rescisão",
  vacation: "Férias",
  fire: "FIRE",
};

const formatBrl = (value: number): string =>
  value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

/**
 * Returns a human-friendly title for a saved simulation.
 *  • Prefers `metadata.label` when present.
 *  • Falls back to a per-tool localized label.
 *  • Falls back to the `tool_id` as last resort.
 *
 * @param simulation The persisted record.
 * @returns The title string for the row.
 */
export const getSimulationTitle = (simulation: SimulationRecord): string => {
  const label = simulation.metadata?.label;
  if (typeof label === "string" && label.length > 0) {
    return label;
  }
  return TOOL_LABELS[simulation.toolId] ?? simulation.toolId;
};

/**
 * Builds a one-line summary of the result for the row, derived from
 * the canonical fields each tool persists. Falls back to `result.summary`
 * when the tool is unknown or the result shape is opaque.
 *
 * @param simulation The persisted record.
 * @returns Summary string for the row, or `null` when nothing
 *  meaningful can be extracted.
 */
export const getSimulationSummary = (
  simulation: SimulationRecord,
): string | null => {
  const result = simulation.result as Record<string, unknown>;
  switch (simulation.toolId) {
    case "compound-interest": {
      const final = result["finalAmount"];
      if (typeof final === "number") {
        return `Montante final ${formatBrl(final)}`;
      }
      break;
    }
    case "cdb-lci-lca": {
      const best = result["bestProduct"];
      const lci = result["lci"] as Record<string, unknown> | undefined;
      const lciNet = lci?.["netAmount"];
      if (typeof best === "string" && typeof lciNet === "number") {
        return `Melhor: ${best.toUpperCase()} · LCI ${formatBrl(lciNet)}`;
      }
      break;
    }
    default:
      break;
  }
  const summary = result["summary"];
  if (typeof summary === "string" && summary.length > 0) {
    return summary;
  }
  return null;
};
