export type SurvivalLevel = "danger" | "tight" | "comfortable" | "robust";

export interface SurvivalInput {
  readonly netWorth: number;
  readonly monthlyExpenses: number;
}

export interface SurvivalAssessment {
  readonly months: number | null;
  readonly level: SurvivalLevel;
  readonly summary: string;
}

const SUMMARIES: Record<SurvivalLevel, string> = {
  danger: "Sua reserva nao cobre nem 1 mes de despesas. Priorize emergencia.",
  tight: "Reserva curta (ate 3 meses). Aumente os aportes.",
  comfortable: "Reserva confortavel (3 a 6 meses).",
  robust: "Reserva robusta (mais de 6 meses).",
};

const classify = (months: number | null): SurvivalLevel => {
  if (months === null || months < 1) {
    return "danger";
  }
  if (months <= 3) {
    return "tight";
  }
  if (months <= 6) {
    return "comfortable";
  }
  return "robust";
};

/**
 * Computes a survival-index assessment: how many months the user can live
 * off their net worth at the current monthly expense pace.
 *
 * Class-based for the same reason as the other dashboard projections —
 * keeps the math reusable across screens (dashboard, future financial
 * health detail) and easy to swap with a richer model (e.g. trailing
 * 3-month expense average) without touching consumers.
 */
export class SurvivalIndexCalculator {
  // eslint-disable-next-line class-methods-use-this
  assess(input: SurvivalInput): SurvivalAssessment {
    const netWorth = Number.isFinite(input.netWorth) ? input.netWorth : 0;
    const monthlyExpenses = Number.isFinite(input.monthlyExpenses)
      ? input.monthlyExpenses
      : 0;

    if (monthlyExpenses <= 0) {
      return {
        months: null,
        level: classify(null),
        summary: SUMMARIES.danger,
      };
    }

    const rawMonths = netWorth / monthlyExpenses;
    const months = rawMonths > 0 ? Math.floor(rawMonths) : 0;
    const level = classify(months);
    return { months, level, summary: SUMMARIES[level] };
  }
}

export const survivalIndexCalculator = new SurvivalIndexCalculator();
