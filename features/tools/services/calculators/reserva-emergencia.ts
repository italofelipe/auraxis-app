/**
 * Domain model for the Reserva de Emergência calculator (#623).
 *
 * Calculates the target emergency fund by professional profile,
 * timeline to reach the goal with compound interest, and
 * compares investment vehicles (Selic, CDB, Fundo DI, Poupança).
 */

import { round2 } from "./math-utils";

export const RESERVA_EMERGENCIA_PUBLIC_PATH = "/tools/reserva-emergencia";

// ─── Profile multipliers ─────────────────────────────────────────────────────

export const PROFILE_OPTIONS = [
  { value: "clt", label: "CLT", months: 6 },
  { value: "pj", label: "PJ / Prestador", months: 12 },
  { value: "autonomo", label: "Autônomo", months: 12 },
  { value: "empresario", label: "Empresário", months: 18 },
] as const;

export type ProfileType = (typeof PROFILE_OPTIONS)[number]["value"];

// ─── Form state ──────────────────────────────────────────────────────────────

export interface ReservaEmergenciaFormState extends Record<string, unknown> {
  monthlyExpenses: number | null;
  profile: ProfileType;
  currentReserve: number;
  monthlyContribution: number | null;
  annualReturnPct: number;
}

export function createDefaultReservaEmergenciaFormState(): ReservaEmergenciaFormState {
  return {
    monthlyExpenses: null,
    profile: "clt",
    currentReserve: 0,
    monthlyContribution: null,
    annualReturnPct: 12.25,
  };
}

// ─── Validation ──────────────────────────────────────────────────────────────

export interface ReservaEmergenciaValidationError {
  field: keyof ReservaEmergenciaFormState;
  messageKey: string;
}

export function validateReservaEmergenciaForm(
  form: ReservaEmergenciaFormState,
): ReservaEmergenciaValidationError[] {
  const errors: ReservaEmergenciaValidationError[] = [];

  if (form.monthlyExpenses === null || form.monthlyExpenses <= 0) {
    errors.push({ field: "monthlyExpenses", messageKey: "errors.expensesRequired" });
  }

  if (form.monthlyContribution === null || form.monthlyContribution <= 0) {
    errors.push({ field: "monthlyContribution", messageKey: "errors.contributionRequired" });
  }

  return errors;
}

// ─── Investment comparison ───────────────────────────────────────────────────

export interface InvestmentComparison {
  name: string;
  annualRatePct: number;
  monthsToTarget: number;
  finalAmount: number;
}

// ─── Timeline point ──────────────────────────────────────────────────────────

export interface ReservaTimelinePoint {
  month: number;
  balance: number;
}

// ─── Result ──────────────────────────────────────────────────────────────────

export interface ReservaEmergenciaResult {
  targetAmount: number;
  profileMonths: number;
  gap: number;
  monthsToTarget: number;
  timeline: ReservaTimelinePoint[];
  investments: InvestmentComparison[];
}

// ─── Reference rates (Selic-based, 2025) ─────────────────────────────────────

const REFERENCE_INVESTMENTS = [
  { name: "Selic / Tesouro Selic", annualRatePct: 14.25 },
  { name: "CDB 100% CDI", annualRatePct: 14.15 },
  { name: "Fundo DI (taxa 0.5%)", annualRatePct: 13.65 },
  { name: "Poupança", annualRatePct: 7.56 },
];

// ─── Calculation ─────────────────────────────────────────────────────────────

interface SimulateTargetOptions {
  current: number;
  monthlyContribution: number;
  monthlyRate: number;
  target: number;
}

function simulateMonthsToTarget(
  options: SimulateTargetOptions,
): { months: number; timeline: ReservaTimelinePoint[]; finalAmount: number } {
  const { current, monthlyContribution, monthlyRate, target } = options;
  const timeline: ReservaTimelinePoint[] = [{ month: 0, balance: round2(current) }];
  let balance = current;
  let month = 0;
  const maxMonths = 600;

  while (balance < target && month < maxMonths) {
    month++;
    balance = balance * (1 + monthlyRate) + monthlyContribution;
    timeline.push({ month, balance: round2(balance) });
  }

  return { months: month, timeline, finalAmount: round2(balance) };
}

export function calculateReservaEmergencia(
  form: ReservaEmergenciaFormState,
): ReservaEmergenciaResult {
  const expenses = form.monthlyExpenses ?? 0;
  const profileEntry = PROFILE_OPTIONS.find((p) => p.value === form.profile) ?? PROFILE_OPTIONS[0];
  const profileMonths = profileEntry.months;
  const targetAmount = round2(expenses * profileMonths);
  const gap = round2(Math.max(0, targetAmount - form.currentReserve));
  const contribution = form.monthlyContribution ?? 0;

  const userMonthlyRate = Math.pow(1 + form.annualReturnPct / 100, 1 / 12) - 1;
  const mainSim = simulateMonthsToTarget({
    current: form.currentReserve,
    monthlyContribution: contribution,
    monthlyRate: userMonthlyRate,
    target: targetAmount,
  });

  const investments: InvestmentComparison[] = REFERENCE_INVESTMENTS.map((inv) => {
    const mr = Math.pow(1 + inv.annualRatePct / 100, 1 / 12) - 1;
    const sim = simulateMonthsToTarget({
      current: form.currentReserve,
      monthlyContribution: contribution,
      monthlyRate: mr,
      target: targetAmount,
    });
    return {
      name: inv.name,
      annualRatePct: inv.annualRatePct,
      monthsToTarget: sim.months,
      finalAmount: sim.finalAmount,
    };
  });

  return {
    targetAmount,
    profileMonths,
    gap,
    monthsToTarget: mainSim.months,
    timeline: mainSim.timeline,
    investments,
  };
}
