/**
 * Domain model for the CET (Custo Efetivo Total) calculator.
 *
 * Computes the total effective cost rate of a loan using Newton-Raphson
 * to find the internal rate that equates the present value of cash flows
 * to the net amount received. Includes IOF auto-calculation per Bacen rules.
 */

import { newtonRaphson, round2 } from "./math-utils";

export const CET_PUBLIC_PATH = "/tools/cet";

const IOF_FIXED_RATE = 0.0038;
const IOF_DAILY_RATE = 0.000082;
const IOF_CAP = 0.03;

export interface CetFormState extends Record<string, unknown> {
  loanAmount: number | null;
  nominalMonthlyRatePct: number | null;
  termMonths: number | null;
  tacAmount: number;
  insuranceMonthly: number;
  appraisalFee: number;
  iofOverride: number | null;
}

export function createDefaultCetFormState(): CetFormState {
  return {
    loanAmount: null,
    nominalMonthlyRatePct: null,
    termMonths: null,
    tacAmount: 0,
    insuranceMonthly: 0,
    appraisalFee: 0,
    iofOverride: null,
  };
}

export interface CetValidationError {
  field: keyof CetFormState;
  messageKey: string;
}

export function validateCetForm(form: CetFormState): CetValidationError[] {
  const errors: CetValidationError[] = [];

  if (form.loanAmount === null || form.loanAmount <= 0) {
    errors.push({ field: "loanAmount", messageKey: "errors.loanAmountRequired" });
  }

  if (form.nominalMonthlyRatePct === null || form.nominalMonthlyRatePct <= 0) {
    errors.push({ field: "nominalMonthlyRatePct", messageKey: "errors.rateRequired" });
  }

  if (form.termMonths === null || form.termMonths < 1) {
    errors.push({ field: "termMonths", messageKey: "errors.termRequired" });
  }

  return errors;
}

export interface CetCashFlow {
  month: number;
  payment: number;
  insurance: number;
  totalPayment: number;
}

export interface CetResult {
  cetMonthlyPct: number;
  cetAnnualPct: number;
  nominalMonthlyPct: number;
  nominalAnnualPct: number;
  totalPaid: number;
  totalCost: number;
  iofAmount: number;
  netAmountReceived: number;
  monthlyPayment: number;
  cashFlows: CetCashFlow[];
}

export function calculateIof(loanAmount: number, termMonths: number): number {
  const fixedIof = loanAmount * IOF_FIXED_RATE;
  const avgDays = (termMonths * 30) / 2;
  const dailyIof = loanAmount * IOF_DAILY_RATE * avgDays;
  const totalIof = fixedIof + dailyIof;
  const capped = Math.min(totalIof, loanAmount * IOF_CAP);
  return round2(capped);
}

function calculatePmt(principal: number, monthlyRate: number, term: number): number {
  return monthlyRate > 0
    ? round2((principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -term)))
    : round2(principal / term);
}

function buildCashFlows(
  pmt: number,
  insuranceMonthly: number,
  term: number,
): { cashFlows: CetCashFlow[]; totalPaid: number } {
  const cashFlows: CetCashFlow[] = [];
  let totalPaid = 0;
  for (let m = 1; m <= term; m++) {
    const total = round2(pmt + insuranceMonthly);
    cashFlows.push({ month: m, payment: pmt, insurance: insuranceMonthly, totalPayment: total });
    totalPaid += total;
  }
  return { cashFlows, totalPaid: round2(totalPaid) };
}

export function calculateCet(form: CetFormState): CetResult | null {
  const principal = form.loanAmount ?? 0;
  const monthlyRate = (form.nominalMonthlyRatePct ?? 0) / 100;
  const term = form.termMonths ?? 0;

  const iofAmount =
    form.iofOverride !== null ? round2(form.iofOverride) : calculateIof(principal, term);

  const netAmountReceived = round2(principal - form.tacAmount - iofAmount - form.appraisalFee);
  const pmt = calculatePmt(principal, monthlyRate, term);
  const { cashFlows, totalPaid } = buildCashFlows(pmt, form.insuranceMonthly, term);
  const totalCost = round2(totalPaid - netAmountReceived);

  const cetMonthly = newtonRaphson({
    f: (r) =>
      cashFlows.reduce((pv, cf, i) => pv + cf.totalPayment / Math.pow(1 + r, i + 1), 0) -
      netAmountReceived,
    fPrime: (r) =>
      cashFlows.reduce(
        (d, cf, i) => d + (-(i + 1) * cf.totalPayment) / Math.pow(1 + r, i + 2),
        0,
      ),
    x0: monthlyRate > 0 ? monthlyRate : 0.01,
  });
  if (cetMonthly === null) {
    return null;
  }

  const cetMonthlyPct = round2(cetMonthly * 100 * 100) / 100;
  const cetAnnualPct = round2((Math.pow(1 + cetMonthly, 12) - 1) * 100 * 100) / 100;

  return {
    cetMonthlyPct,
    cetAnnualPct,
    nominalMonthlyPct: round2((form.nominalMonthlyRatePct ?? 0) * 100) / 100,
    nominalAnnualPct: round2((Math.pow(1 + monthlyRate, 12) - 1) * 100 * 100) / 100,
    totalPaid,
    totalCost,
    iofAmount,
    netAmountReceived,
    monthlyPayment: pmt,
    cashFlows,
  };
}
