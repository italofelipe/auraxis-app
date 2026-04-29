/**
 * Pure-math compound interest calculator (DEC-196 lote B).
 *
 * Computes the future value of an investment with an optional monthly
 * contribution, using the standard FV formula:
 *
 *   FV = P·(1+r)^n  +  C · ((1+r)^n − 1) / r
 *
 * where `r` is the per-period rate, `n` the number of periods, `P` the
 * initial principal and `C` the recurring contribution.
 *
 * The annual rate input is converted to a monthly rate via the canonical
 * compound conversion `r_m = (1 + r_a)^(1/12) − 1` so a 12 % annual rate
 * yields exactly 12 % at the end of one year regardless of contribution
 * cadence.
 *
 * Stays as a pure function so it can be unit-tested in isolation and
 * reused by the screen controller without any reactive dependency.
 */

export type CompoundInterestRegime = "monthly" | "yearly";

export interface CompoundInterestInputs {
  readonly initialAmount: number;
  readonly monthlyContribution: number;
  readonly annualRatePercent: number;
  readonly months: number;
  readonly regime: CompoundInterestRegime;
}

export interface CompoundInterestSchedulePoint {
  readonly month: number;
  readonly invested: number;
  readonly interest: number;
  readonly balance: number;
}

export interface CompoundInterestResult {
  readonly finalAmount: number;
  readonly totalContributed: number;
  readonly totalInterest: number;
  readonly schedule: readonly CompoundInterestSchedulePoint[];
}

const monthlyRateFromAnnual = (
  annualRatePercent: number,
  regime: CompoundInterestRegime,
): number => {
  const annualRate = annualRatePercent / 100;
  if (regime === "monthly") {
    return annualRate / 12;
  }
  return Math.pow(1 + annualRate, 1 / 12) - 1;
};

const round2 = (value: number): number => Math.round(value * 100) / 100;

/**
 * Calculates the schedule and final values for the inputs.
 * @param inputs Validated inputs from the screen.
 * @returns Compound interest result with month-by-month schedule.
 */
export const calculateCompoundInterest = (
  inputs: CompoundInterestInputs,
): CompoundInterestResult => {
  const { initialAmount, monthlyContribution, months } = inputs;
  const monthlyRate = monthlyRateFromAnnual(inputs.annualRatePercent, inputs.regime);

  const schedule: CompoundInterestSchedulePoint[] = [];
  let balance = initialAmount;
  let invested = initialAmount;

  for (let m = 1; m <= months; m += 1) {
    balance = balance * (1 + monthlyRate) + monthlyContribution;
    invested += monthlyContribution;
    schedule.push({
      month: m,
      invested: round2(invested),
      interest: round2(balance - invested),
      balance: round2(balance),
    });
  }

  return {
    finalAmount: round2(balance),
    totalContributed: round2(invested),
    totalInterest: round2(balance - invested),
    schedule,
  };
};
