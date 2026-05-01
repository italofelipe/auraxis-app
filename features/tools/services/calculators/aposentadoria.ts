/**
 * Domain model for the Simulador de Aposentadoria, mirrored from
 * `auraxis-web/app/features/tools/model/aposentadoria.ts`.
 *
 * Uses the "Rule of 25x" (4% Safe Withdrawal Rate) to determine the
 * required patrimony and monthly contribution to retire at a target age
 * with a desired monthly income in today's Reais.
 */

import { round2 } from "./math-utils";

export const APOSENTADORIA_TABLE_YEAR = 2025;

export interface AposentadoriaChartPoint {
  readonly age: number;
  readonly patrimony: number;
}

export interface AposentadoriaResult {
  readonly requiredPatrimony: number;
  readonly monthsToRetirement: number;
  readonly requiredMonthlyContribution: number;
  readonly projectedPatrimony: number;
  readonly isOnTrack: boolean;
  readonly chartData: readonly AposentadoriaChartPoint[];
  readonly sensitivityMinus20pct: number;
  readonly sensitivityPlus20pct: number;
  readonly realReturnPct: number;
}

export interface AposentadoriaFormState extends Record<string, unknown> {
  currentAge: number;
  retirementAge: number;
  desiredMonthlyIncome: number | null;
  currentPatrimony: number;
  expectedReturnPct: number;
  ipcaPct: number;
  lifeExpectancy: number;
}

export const createDefaultAposentadoriaFormState =
  (): AposentadoriaFormState => ({
    currentAge: 30,
    retirementAge: 65,
    desiredMonthlyIncome: null,
    currentPatrimony: 0,
    expectedReturnPct: 8.0,
    ipcaPct: 4.5,
    lifeExpectancy: 90,
  });

export interface AposentadoriaValidationError {
  readonly field: keyof AposentadoriaFormState;
  readonly messageKey: string;
}

export const validateAposentadoriaForm = (
  form: AposentadoriaFormState,
): AposentadoriaValidationError[] => {
  const errors: AposentadoriaValidationError[] = [];
  if (form.retirementAge <= form.currentAge) {
    errors.push({
      field: "retirementAge",
      messageKey: "errors.retirementAgeAfterCurrent",
    });
  }
  if (form.desiredMonthlyIncome === null || form.desiredMonthlyIncome <= 0) {
    errors.push({
      field: "desiredMonthlyIncome",
      messageKey: "errors.incomeRequired",
    });
  }
  if (form.expectedReturnPct <= 0) {
    errors.push({
      field: "expectedReturnPct",
      messageKey: "errors.returnRequired",
    });
  }
  if (form.lifeExpectancy <= form.retirementAge) {
    errors.push({
      field: "lifeExpectancy",
      messageKey: "errors.lifeExpectancyAfterRetirement",
    });
  }
  return errors;
};

interface PmtOptions {
  readonly fv: number;
  readonly pv: number;
  readonly r: number;
  readonly n: number;
}

const calcPmt = (opts: PmtOptions): number => {
  if (opts.n <= 0) {
    return 0;
  }
  const growth = Math.pow(1 + opts.r, opts.n);
  const pvGrown = opts.pv * growth;
  if (pvGrown >= opts.fv) {
    return 0;
  }
  return round2(((opts.fv - pvGrown) * opts.r) / (growth - 1));
};

interface ChartDataOptions {
  readonly pv: number;
  readonly monthlyPmt: number;
  readonly monthlyRate: number;
  readonly currentAge: number;
  readonly retirementAge: number;
}

const buildChartData = (
  opts: ChartDataOptions,
): AposentadoriaChartPoint[] => {
  const chartData: AposentadoriaChartPoint[] = [];
  let patrimony = opts.pv;
  for (let age = opts.currentAge; age <= opts.retirementAge; age += 1) {
    chartData.push({ age, patrimony: round2(patrimony) });
    for (let m = 0; m < 12; m += 1) {
      patrimony = patrimony * (1 + opts.monthlyRate) + opts.monthlyPmt;
    }
  }
  return chartData;
};

const round4 = (value: number): number =>
  Math.round(value * 10000) / 10000;

export const calculateAposentadoria = (
  form: AposentadoriaFormState,
): AposentadoriaResult => {
  const nominalAnnual = form.expectedReturnPct / 100;
  const inflationAnnual = form.ipcaPct / 100;
  const realAnnual = (1 + nominalAnnual) / (1 + inflationAnnual) - 1;
  const monthlyRate = Math.pow(1 + nominalAnnual, 1 / 12) - 1;
  const monthsToRetirement = (form.retirementAge - form.currentAge) * 12;
  const desiredIncome = form.desiredMonthlyIncome ?? 0;
  const requiredPatrimony = round2((desiredIncome * 12) / 0.04);
  const pv = form.currentPatrimony;

  const requiredMonthlyContribution = calcPmt({
    fv: requiredPatrimony,
    pv,
    r: monthlyRate,
    n: monthsToRetirement,
  });

  const growth = Math.pow(1 + monthlyRate, monthsToRetirement);
  const projectedPatrimony = round2(
    pv * growth +
      (monthlyRate === 0
        ? requiredMonthlyContribution * monthsToRetirement
        : (requiredMonthlyContribution * (growth - 1)) / monthlyRate),
  );
  const isOnTrack = projectedPatrimony >= requiredPatrimony;

  const chartData = buildChartData({
    pv,
    monthlyPmt: requiredMonthlyContribution,
    monthlyRate,
    currentAge: form.currentAge,
    retirementAge: form.retirementAge,
  });

  const monthsLater = (form.retirementAge + 5 - form.currentAge) * 12;
  const monthsEarlier = Math.max(
    (form.retirementAge - 5 - form.currentAge) * 12,
    1,
  );

  return {
    requiredPatrimony,
    monthsToRetirement,
    requiredMonthlyContribution,
    projectedPatrimony,
    isOnTrack,
    chartData,
    sensitivityMinus20pct: calcPmt({
      fv: requiredPatrimony,
      pv,
      r: monthlyRate,
      n: monthsLater,
    }),
    sensitivityPlus20pct: calcPmt({
      fv: requiredPatrimony,
      pv,
      r: monthlyRate,
      n: monthsEarlier,
    }),
    realReturnPct: round4(realAnnual * 100),
  };
};
