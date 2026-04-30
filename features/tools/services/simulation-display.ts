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
  "emergency-fund": "Reserva de emergência",
  "fifty-thirty-twenty": "Orçamento 50-30-20",
  "currency-converter": "Conversor de moedas",
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

type ResultBag = Record<string, unknown>;

const summarizeCompoundInterest = (result: ResultBag): string | null => {
  const final = result["finalAmount"];
  return typeof final === "number" ? `Montante final ${formatBrl(final)}` : null;
};

const summarizeCdbLciLca = (result: ResultBag): string | null => {
  const best = result["bestProduct"];
  const lci = result["lci"] as ResultBag | undefined;
  const lciNet = lci?.["netAmount"];
  if (typeof best === "string" && typeof lciNet === "number") {
    return `Melhor: ${best.toUpperCase()} · LCI ${formatBrl(lciNet)}`;
  }
  return null;
};

const summarizeEmergencyFund = (result: ResultBag): string | null => {
  const target = result["targetAmount"];
  const months = result["monthsToTarget"];
  if (typeof target === "number" && typeof months === "number") {
    return `Meta ${formatBrl(target)} · ${months === 0 ? "alcançada" : `${months} meses`}`;
  }
  return null;
};

const summarizeFiftyThirtyTwenty = (result: ResultBag): string | null => {
  const income = result["netIncome"];
  if (typeof income !== "number") {
    return null;
  }
  const surplus = result["surplus"];
  if (typeof surplus === "number") {
    return `${formatBrl(income)} · ${surplus < 0 ? "déficit" : "sobra"} ${formatBrl(Math.abs(surplus))}`;
  }
  return `Renda ${formatBrl(income)}`;
};

const summarizeCurrencyConverter = (result: ResultBag): string | null => {
  const converted = result["convertedAmount"];
  const from = result["fromCurrency"];
  const to = result["toCurrency"];
  if (typeof converted !== "number" || typeof from !== "string" || typeof to !== "string") {
    return null;
  }
  const amount = converted.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });
  return `${from} → ${to} · ${amount}`;
};

const SUMMARIZERS: Readonly<Record<string, (result: ResultBag) => string | null>> = {
  "compound-interest": summarizeCompoundInterest,
  "cdb-lci-lca": summarizeCdbLciLca,
  "emergency-fund": summarizeEmergencyFund,
  "fifty-thirty-twenty": summarizeFiftyThirtyTwenty,
  "currency-converter": summarizeCurrencyConverter,
};

const fallbackSummary = (result: ResultBag): string | null => {
  const summary = result["summary"];
  return typeof summary === "string" && summary.length > 0 ? summary : null;
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
  const result = simulation.result as ResultBag;
  const summarizer = SUMMARIZERS[simulation.toolId];
  return summarizer?.(result) ?? fallbackSummary(result);
};
