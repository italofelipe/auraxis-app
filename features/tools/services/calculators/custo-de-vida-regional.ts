import costOfLivingByUf from "@/features/tools/data/cost-of-living-by-uf.json";

import { round2 } from "@/features/tools/services/calculators/math-utils";

export const CUSTO_VIDA_REGIONAL_PUBLIC_PATH = "/tools/custo-de-vida-regional";
export const DEFAULT_REAL_RETURN_PCT = 4;
export const SAFE_WITHDRAWAL_MULTIPLIER = 25;

interface RegionalEntry {
  readonly name: string;
  readonly avgIncome: number;
  readonly avgCost: number;
}

const REGIONAL_DATA = (costOfLivingByUf as { data: Record<string, RegionalEntry> }).data;

const normalizeUf = (uf: string): string => uf.trim().toUpperCase();

export const UF_CODES: readonly string[] = Object.keys(REGIONAL_DATA).sort((a, b) =>
  a.localeCompare(b),
);

export function getRegionalEntry(uf: string): RegionalEntry | null {
  return REGIONAL_DATA[normalizeUf(uf)] ?? null;
}

export const EXPENSE_CATEGORY_KEYS = [
  "housing",
  "transport",
  "food",
  "leisure",
  "other",
] as const;

export type ExpenseCategoryKey = (typeof EXPENSE_CATEGORY_KEYS)[number];

export interface RegionalCostFormState extends Record<string, unknown> {
  readonly uf: string;
  readonly monthlyIncome: number;
  readonly housing: number;
  readonly transport: number;
  readonly food: number;
  readonly leisure: number;
  readonly other: number;
}

export function createDefaultRegionalCostFormState(): RegionalCostFormState {
  return {
    uf: "SP",
    monthlyIncome: 0,
    housing: 0,
    transport: 0,
    food: 0,
    leisure: 0,
    other: 0,
  };
}

export interface RegionalCostValidationError {
  readonly field: string;
  readonly messageKey: string;
}

export function validateRegionalCostForm(
  form: RegionalCostFormState,
): readonly RegionalCostValidationError[] {
  const errors: RegionalCostValidationError[] = [];

  if (getRegionalEntry(form.uf) === null) {
    errors.push({ field: "uf", messageKey: "errors.ufRequired" });
  }

  if (!Number.isFinite(form.monthlyIncome) || form.monthlyIncome <= 0) {
    errors.push({ field: "monthlyIncome", messageKey: "errors.incomeRequired" });
  }

  const totalExpenses = EXPENSE_CATEGORY_KEYS.reduce(
    (sum, key) => sum + (Number.isFinite(form[key]) ? form[key] : 0),
    0,
  );
  if (!Number.isFinite(totalExpenses) || totalExpenses <= 0) {
    errors.push({ field: "expenses", messageKey: "errors.atLeastOneExpenseRequired" });
  }

  return errors;
}

export interface CategoryBreakdown {
  readonly key: ExpenseCategoryKey;
  readonly amount: number;
  readonly pctOfIncome: number;
  readonly pctOfTotal: number;
}

export interface RegionalComparison {
  readonly uf: string;
  readonly name: string;
  readonly avgIncome: number;
  readonly avgCost: number;
  readonly costVsRegionalPct: number;
  readonly incomeVsRegionalPct: number;
}

export interface RegionalCostResult {
  readonly totalMonthlyCost: number;
  readonly totalAnnualCost: number;
  readonly committedPct: number;
  readonly savingsRatePct: number;
  readonly monthlySavings: number;
  readonly categories: readonly CategoryBreakdown[];
  readonly targetWealth: number;
  readonly yearsToRetirement: number | null;
  readonly regional: RegionalComparison;
  readonly sustainabilityScore: number;
}

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export function estimateYearsToRetirement(
  monthlySavings: number,
  targetWealth: number,
  annualRealReturnPct: number = DEFAULT_REAL_RETURN_PCT,
): number | null {
  if (monthlySavings <= 0 || targetWealth <= 0) {
    return null;
  }
  const monthlyRate = Math.pow(1 + annualRealReturnPct / 100, 1 / 12) - 1;
  if (monthlyRate === 0) {
    return round2(targetWealth / monthlySavings / 12);
  }
  const months =
    Math.log(1 + (targetWealth * monthlyRate) / monthlySavings) /
    Math.log(1 + monthlyRate);
  return round2(months / 12);
}

interface SustainabilityInput {
  readonly savingsRatePct: number;
  readonly totalMonthlyCost: number;
  readonly regionalAvgCost: number;
}

export function computeSustainabilityScore(input: SustainabilityInput): number {
  const savingsScore = clamp((input.savingsRatePct / 20) * 100, 0, 100);
  const ratio =
    input.regionalAvgCost > 0 ? input.totalMonthlyCost / input.regionalAvgCost : 1;
  const regionalScore = clamp((2 - ratio) * 100, 0, 100);
  return Math.round(clamp(0.7 * savingsScore + 0.3 * regionalScore, 0, 100));
}

export function calculateRegionalCost(form: RegionalCostFormState): RegionalCostResult {
  const uf = normalizeUf(form.uf);
  const income = form.monthlyIncome;
  const totalMonthlyCost = round2(
    EXPENSE_CATEGORY_KEYS.reduce((sum, key) => sum + (form[key] || 0), 0),
  );
  const totalAnnualCost = round2(totalMonthlyCost * 12);
  const monthlySavings = round2(income - totalMonthlyCost);
  const committedPct = income > 0 ? round2((totalMonthlyCost / income) * 100) : 0;
  const savingsRatePct = income > 0 ? round2((monthlySavings / income) * 100) : 0;

  const categories: CategoryBreakdown[] = EXPENSE_CATEGORY_KEYS.map((key) => {
    const amount = round2(form[key] || 0);
    return {
      key,
      amount,
      pctOfIncome: income > 0 ? round2((amount / income) * 100) : 0,
      pctOfTotal: totalMonthlyCost > 0 ? round2((amount / totalMonthlyCost) * 100) : 0,
    };
  });

  const targetWealth = round2(totalAnnualCost * SAFE_WITHDRAWAL_MULTIPLIER);
  const yearsToRetirement = estimateYearsToRetirement(monthlySavings, targetWealth);
  const entry = getRegionalEntry(uf) ?? { name: uf, avgIncome: 0, avgCost: 0 };
  const regional: RegionalComparison = {
    uf,
    name: entry.name,
    avgIncome: entry.avgIncome,
    avgCost: entry.avgCost,
    costVsRegionalPct:
      entry.avgCost > 0 ? round2((totalMonthlyCost / entry.avgCost - 1) * 100) : 0,
    incomeVsRegionalPct:
      entry.avgIncome > 0 ? round2((income / entry.avgIncome - 1) * 100) : 0,
  };

  return {
    totalMonthlyCost,
    totalAnnualCost,
    committedPct,
    savingsRatePct,
    monthlySavings,
    categories,
    targetWealth,
    yearsToRetirement,
    regional,
    sustainabilityScore: computeSustainabilityScore({
      savingsRatePct,
      totalMonthlyCost,
      regionalAvgCost: entry.avgCost,
    }),
  };
}

export function encodeFormToQuery(form: RegionalCostFormState): string {
  return btoa(
    JSON.stringify({
      u: normalizeUf(form.uf),
      i: form.monthlyIncome,
      h: form.housing,
      t: form.transport,
      f: form.food,
      l: form.leisure,
      o: form.other,
    }),
  );
}

const coerceNumber = (value: unknown): number =>
  typeof value === "number" && Number.isFinite(value) ? value : 0;

export function decodeQueryToForm(encoded: string): RegionalCostFormState | null {
  try {
    const data = JSON.parse(atob(encoded)) as Record<string, unknown>;
    if (typeof data.u !== "string") {
      return null;
    }
    return {
      uf: normalizeUf(data.u),
      monthlyIncome: coerceNumber(data.i),
      housing: coerceNumber(data.h),
      transport: coerceNumber(data.t),
      food: coerceNumber(data.f),
      leisure: coerceNumber(data.l),
      other: coerceNumber(data.o),
    };
  } catch {
    return null;
  }
}
