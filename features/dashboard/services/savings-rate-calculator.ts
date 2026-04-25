export type SavingsRateLevel = "negative" | "low" | "healthy" | "excellent";

export interface SavingsRateInput {
  readonly incomes: number;
  readonly expenses: number;
}

export interface SavingsRateAssessment {
  readonly rate: number;
  readonly level: SavingsRateLevel;
  readonly summary: string;
}

const SUMMARIES: Record<SavingsRateLevel, string> = {
  negative: "Voce gastou mais do que recebeu neste periodo.",
  low: "Esta poupando pouco. Tente reduzir despesas variaveis.",
  healthy: "Boa taxa de poupanca. Continue assim.",
  excellent: "Excelente taxa de poupanca!",
};

/**
 * Computes a deterministic savings rate (savings / income) and classifies it.
 *
 * Class-based on purpose: keeps the math reusable across screens (dashboard,
 * monthly summary, goals projection) and easy to swap with a richer model
 * (e.g. trailing 3-month average) without touching consumers.
 */
export class SavingsRateCalculator {
  /**
   * @param input - Period incomes and expenses.
   * @returns Savings rate (0..1), level label and a short summary in pt-BR.
   */
  assess(input: SavingsRateInput): SavingsRateAssessment {
    const incomes = Number.isFinite(input.incomes) ? input.incomes : 0;
    const expenses = Number.isFinite(input.expenses) ? input.expenses : 0;

    if (incomes <= 0) {
      return { rate: 0, level: "negative", summary: SUMMARIES.negative };
    }

    const savings = incomes - expenses;
    const rate = savings / incomes;
    const level = this.classify(rate);
    return { rate, level, summary: SUMMARIES[level] };
  }

  private classify(rate: number): SavingsRateLevel {
    if (rate <= 0) return "negative";
    if (rate < 0.1) return "low";
    if (rate < 0.3) return "healthy";
    return "excellent";
  }
}

export const savingsRateCalculator = new SavingsRateCalculator();
