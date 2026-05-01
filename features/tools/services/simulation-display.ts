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
  "fgts-balance": "FGTS",
  treasury: "Tesouro Direto",
  fii: "FII",
  "cet-calculator": "CET",
  mortgage: "Financiamento imobiliário",
  "debt-payoff": "Quitação de dívidas",
  "rent-vs-buy": "Alugar vs comprar",
  "split-bill": "Dividir conta",
  "cost-of-lifestyle": "Custo do estilo de vida",
  aposentadoria: "Aposentadoria",
  "desconto-markup": "Desconto, markup e margem",
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

const summarizeFgts = (result: ResultBag): string | null => {
  const balance = result["projectedBalance"];
  const withdrawable = result["withdrawableAmount"];
  if (typeof balance === "number") {
    if (typeof withdrawable === "number") {
      return `Saldo ${formatBrl(balance)} · saque ${formatBrl(withdrawable)}`;
    }
    return `Saldo ${formatBrl(balance)}`;
  }
  return null;
};

const summarizeTreasury = (result: ResultBag): string | null => {
  const net = result["netAmount"];
  const annualized = result["annualizedNetReturn"];
  if (typeof net === "number" && typeof annualized === "number") {
    return `Líquido ${formatBrl(net)} · ${(annualized * 100).toFixed(2)}% a.a.`;
  }
  return null;
};

const summarizeFii = (result: ResultBag): string | null => {
  const dy = result["dividendYield"];
  const monthly = result["monthlyIncome"];
  if (typeof dy !== "number") {
    return null;
  }
  if (typeof monthly === "number") {
    return `DY ${dy.toFixed(2)}% · ${formatBrl(monthly)}/mês`;
  }
  return `DY ${dy.toFixed(2)}%`;
};

const summarizeCet = (result: ResultBag): string | null => {
  const cetAnnual = result["cetAnnualPct"];
  const totalPaid = result["totalPaid"];
  if (typeof cetAnnual === "number" && typeof totalPaid === "number") {
    return `CET ${cetAnnual.toFixed(2)}% a.a. · ${formatBrl(totalPaid)}`;
  }
  return null;
};

const summarizeMortgage = (result: ResultBag): string | null => {
  const loan = result["loanAmount"];
  const sac = result["sac"] as ResultBag | undefined;
  const sacFirst = sac?.["firstPayment"];
  if (typeof loan === "number" && typeof sacFirst === "number") {
    return `${formatBrl(loan)} financiado · 1ª SAC ${formatBrl(sacFirst)}`;
  }
  return null;
};

const summarizeDebtPayoff = (result: ResultBag): string | null => {
  const total = result["totalDebt"];
  const best = result["bestStrategy"];
  if (typeof total === "number" && typeof best === "string") {
    return `${formatBrl(total)} · ${best === "snowball" ? "bola de neve" : "avalanche"}`;
  }
  return null;
};

const summarizeRentVsBuy = (result: ResultBag): string | null => {
  const buyIsBetter = result["buyIsBetter"];
  const breakEven = result["breakEvenYear"];
  if (typeof buyIsBetter !== "boolean") {
    return null;
  }
  const verdict = buyIsBetter ? "comprar vence" : "alugar vence";
  if (typeof breakEven === "number") {
    return `${verdict} · break-even ${breakEven}a`;
  }
  return verdict;
};

const summarizeSplitBill = (result: ResultBag): string | null => {
  const total = result["totalWithFees"];
  const perPerson = result["perPersonEqual"];
  if (typeof total === "number" && typeof perPerson === "number") {
    return `${formatBrl(total)} · ${formatBrl(perPerson)}/pessoa`;
  }
  return null;
};

const summarizeCostOfLifestyle = (result: ResultBag): string | null => {
  const monthly = result["totalMonthlyCost"];
  const opportunity = result["totalOpportunityCost"];
  if (typeof monthly === "number" && typeof opportunity === "number") {
    return `${formatBrl(monthly)}/mês · custo ${formatBrl(opportunity)}`;
  }
  return null;
};

const summarizeAposentadoria = (result: ResultBag): string | null => {
  const required = result["requiredPatrimony"];
  const monthly = result["requiredMonthlyContribution"];
  if (typeof required === "number" && typeof monthly === "number") {
    return `Alvo ${formatBrl(required)} · ${formatBrl(monthly)}/mês`;
  }
  return null;
};

const summarizeDescontoMarkup = (result: ResultBag): string | null => {
  const value = result["calculatedValue"];
  const mode = result["mode"];
  if (typeof value !== "number" || typeof mode !== "string") {
    return null;
  }
  if (mode === "margem") {
    return `Margem ${value.toFixed(2)}%`;
  }
  return `${mode} · ${formatBrl(value)}`;
};

const SUMMARIZERS: Readonly<Record<string, (result: ResultBag) => string | null>> = {
  "compound-interest": summarizeCompoundInterest,
  "cdb-lci-lca": summarizeCdbLciLca,
  "emergency-fund": summarizeEmergencyFund,
  "fifty-thirty-twenty": summarizeFiftyThirtyTwenty,
  "currency-converter": summarizeCurrencyConverter,
  "fgts-balance": summarizeFgts,
  treasury: summarizeTreasury,
  fii: summarizeFii,
  "cet-calculator": summarizeCet,
  mortgage: summarizeMortgage,
  "debt-payoff": summarizeDebtPayoff,
  "rent-vs-buy": summarizeRentVsBuy,
  "split-bill": summarizeSplitBill,
  "cost-of-lifestyle": summarizeCostOfLifestyle,
  aposentadoria: summarizeAposentadoria,
  "desconto-markup": summarizeDescontoMarkup,
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
