/**
 * Domain model for the Quitação de Dívidas calculator (#626).
 *
 * Simulates two debt payoff strategies:
 * - Snowball: pay off smallest balance first.
 * - Avalanche: pay off highest interest rate first.
 *
 * Generates month-by-month amortization for each strategy.
 */

import { round2 } from "./math-utils";

export const QUITACAO_DIVIDAS_PUBLIC_PATH = "/tools/quitacao-dividas";

// ─── Debt entry ──────────────────────────────────────────────────────────────

export interface DebtEntry {
  name: string;
  balance: number;
  monthlyRatePct: number;
  minimumPayment: number;
}

// ─── Form state ──────────────────────────────────────────────────────────────

export interface QuitacaoDividasFormState extends Record<string, unknown> {
  debts: DebtEntry[];
  extraPayment: number;
}

/**
 * @returns A blank debt entry.
 */
export function createDefaultDebtEntry(): DebtEntry {
  return { name: "", balance: 0, monthlyRatePct: 0, minimumPayment: 0 };
}

/**
 * @returns Default form state with two blank debts.
 */
export function createDefaultQuitacaoDividasFormState(): QuitacaoDividasFormState {
  return {
    debts: [createDefaultDebtEntry(), createDefaultDebtEntry()],
    extraPayment: 0,
  };
}

// ─── Validation ──────────────────────────────────────────────────────────────

export interface QuitacaoDividasValidationError {
  field: string;
  messageKey: string;
}

/**
 * @param form
 * @returns Validation errors, if any.
 */
export function validateQuitacaoDividasForm(
  form: QuitacaoDividasFormState,
): QuitacaoDividasValidationError[] {
  const errors: QuitacaoDividasValidationError[] = [];

  if (form.debts.length < 2) {
    errors.push({ field: "debts", messageKey: "errors.minTwoDebts" });
  }

  const hasValidDebt = form.debts.some((d) => d.balance > 0 && d.minimumPayment > 0);
  if (!hasValidDebt) {
    errors.push({ field: "debts", messageKey: "errors.atLeastOneDebtRequired" });
  }

  return errors;
}

// ─── Timeline ────────────────────────────────────────────────────────────────

export interface PayoffTimelinePoint {
  month: number;
  totalBalance: number;
  totalPaid: number;
}

export type PayoffStrategy = "snowball" | "avalanche";

export interface StrategyResult {
  strategy: PayoffStrategy;
  totalMonths: number;
  totalPaid: number;
  totalInterest: number;
  timeline: PayoffTimelinePoint[];
}

// ─── Result ──────────────────────────────────────────────────────────────────

export interface QuitacaoDividasResult {
  totalDebt: number;
  snowball: StrategyResult;
  avalanche: StrategyResult;
  interestSaved: number;
  monthsSaved: number;
  bestStrategy: PayoffStrategy;
}

// ─── Simulation ──────────────────────────────────────────────────────────────

interface SimDebt {
  balance: number;
  monthlyRate: number;
  minimumPayment: number;
}

/**
 * @param simDebts
 * @returns Sum of all remaining balances.
 */
function getTotalBalance(simDebts: SimDebt[]): number {
  return simDebts.reduce((sum, d) => sum + d.balance, 0);
}

/**
 * @param simDebts Mutated in place — interest accrues on positive balances.
 */
function applyInterest(simDebts: SimDebt[]): void {
  for (const d of simDebts) {
    if (d.balance > 0) { d.balance = d.balance * (1 + d.monthlyRate); }
  }
}

/**
 * @param simDebts Mutated in place — minimum payments applied.
 * @returns Total paid this step.
 */
function payMinimums(simDebts: SimDebt[]): number {
  let paid = 0;
  for (const d of simDebts) {
    if (d.balance > 0) {
      const payment = Math.min(d.minimumPayment, d.balance);
      d.balance -= payment;
      paid += payment;
    }
  }
  return paid;
}

/**
 * @param simDebts Mutated in place — extra payment allocated per strategy.
 * @param extraPayment
 * @param strategy
 * @returns Total extra paid this step.
 */
function allocateExtra(simDebts: SimDebt[], extraPayment: number, strategy: PayoffStrategy): number {
  const active = simDebts.filter((d) => d.balance > 0);
  if (strategy === "snowball") { active.sort((a, b) => a.balance - b.balance); }
  else { active.sort((a, b) => b.monthlyRate - a.monthlyRate); }

  let remaining = extraPayment;
  let paid = 0;
  for (const d of active) {
    if (remaining <= 0) { break; }
    const payment = Math.min(remaining, d.balance);
    d.balance -= payment;
    paid += payment;
    remaining -= payment;
  }
  return paid;
}

/**
 * @param debts
 * @param extraPayment
 * @param strategy
 * @returns Strategy simulation result.
 */
function simulateStrategy(debts: DebtEntry[], extraPayment: number, strategy: PayoffStrategy): StrategyResult {
  const simDebts: SimDebt[] = debts.filter((d) => d.balance > 0).map((d) => ({
    balance: d.balance, monthlyRate: d.monthlyRatePct / 100, minimumPayment: d.minimumPayment,
  }));

  const timeline: PayoffTimelinePoint[] = [{ month: 0, totalBalance: round2(getTotalBalance(simDebts)), totalPaid: 0 }];
  let month = 0;
  let totalPaid = 0;

  while (getTotalBalance(simDebts) > 0.01 && month < 600) {
    month++;
    applyInterest(simDebts);
    totalPaid += payMinimums(simDebts);
    totalPaid += allocateExtra(simDebts, extraPayment, strategy);
    for (const d of simDebts) { d.balance = round2(Math.max(0, d.balance)); }
    timeline.push({ month, totalBalance: round2(getTotalBalance(simDebts)), totalPaid: round2(totalPaid) });
  }

  const originalDebt = debts.filter((d) => d.balance > 0).reduce((s, d) => s + d.balance, 0);
  return { strategy, totalMonths: month, totalPaid: round2(totalPaid), totalInterest: round2(totalPaid - originalDebt), timeline };
}

/**
 * @param form
 * @returns Debt payoff comparison result.
 */
export function calculateQuitacaoDividas(
  form: QuitacaoDividasFormState,
): QuitacaoDividasResult {
  const validDebts = form.debts.filter((d) => d.balance > 0 && d.minimumPayment > 0);
  const totalDebt = round2(validDebts.reduce((s, d) => s + d.balance, 0));

  const snowball = simulateStrategy(validDebts, form.extraPayment, "snowball");
  const avalanche = simulateStrategy(validDebts, form.extraPayment, "avalanche");

  const interestSaved = round2(Math.abs(snowball.totalInterest - avalanche.totalInterest));
  const monthsSaved = Math.abs(snowball.totalMonths - avalanche.totalMonths);
  const bestStrategy: PayoffStrategy =
    avalanche.totalInterest <= snowball.totalInterest ? "avalanche" : "snowball";

  return { totalDebt, snowball, avalanche, interestSaved, monthsSaved, bestStrategy };
}
