import { passwordPolicy } from "@/features/auth/validators";

export type PasswordStrengthLevel =
  | "empty"
  | "weak"
  | "fair"
  | "good"
  | "strong";

export interface PasswordStrengthCriterion {
  readonly id: "length" | "uppercase" | "digit" | "symbol";
  readonly label: string;
  readonly satisfied: boolean;
}

export interface PasswordStrengthAssessment {
  readonly level: PasswordStrengthLevel;
  readonly score: number;
  readonly criteria: readonly PasswordStrengthCriterion[];
  readonly missingLabels: readonly string[];
  readonly summary: string;
}

export interface PasswordPolicy {
  readonly minLength: number;
  readonly patterns: {
    readonly uppercase: RegExp;
    readonly lowercase: RegExp;
    readonly digit: RegExp;
    readonly symbol: RegExp;
  };
}

const SUMMARY_BY_LEVEL: Record<PasswordStrengthLevel, string> = {
  empty: "Defina uma senha forte.",
  weak: "Senha muito fraca.",
  fair: "Senha razoavel.",
  good: "Senha boa.",
  strong: "Senha forte.",
};

const scoreToLevel = (score: number): PasswordStrengthLevel => {
  if (score <= 1) {return "weak";}
  if (score === 2) {return "fair";}
  if (score === 3) {return "good";}
  return "strong";
};

/**
 * Encapsulates the policy-driven strength analysis for user-provided passwords.
 *
 * The analyzer is intentionally framework-agnostic so it can be reused by the
 * register and reset password flows, plus any QA tooling that must validate
 * the policy contract.
 */
export class PasswordStrengthAnalyzer {
  private readonly policy: PasswordPolicy;

  constructor(policy: PasswordPolicy = passwordPolicy) {
    this.policy = policy;
  }

  /**
   * Analyzes a password against the configured policy.
   *
   * @param password - User input. May be empty.
   * @returns Structured assessment with score, level, and missing criteria.
   */
  analyze(password: string): PasswordStrengthAssessment {
    if (password.length === 0) {
      const criteria = this.buildCriteria("");
      return {
        level: "empty",
        score: 0,
        criteria,
        missingLabels: criteria.map((item) => item.label),
        summary: SUMMARY_BY_LEVEL.empty,
      };
    }

    const criteria = this.buildCriteria(password);
    const score = criteria.reduce((acc, item) => (item.satisfied ? acc + 1 : acc), 0);
    const level = scoreToLevel(score);

    return {
      level,
      score,
      criteria,
      missingLabels: criteria
        .filter((item) => !item.satisfied)
        .map((item) => item.label),
      summary: SUMMARY_BY_LEVEL[level],
    };
  }

  private buildCriteria(password: string): readonly PasswordStrengthCriterion[] {
    return [
      {
        id: "length",
        label: `Pelo menos ${this.policy.minLength} caracteres`,
        satisfied: password.length >= this.policy.minLength,
      },
      {
        id: "uppercase",
        label: "Uma letra maiuscula",
        satisfied: this.policy.patterns.uppercase.test(password),
      },
      {
        id: "digit",
        label: "Um numero",
        satisfied: this.policy.patterns.digit.test(password),
      },
      {
        id: "symbol",
        label: "Um simbolo",
        satisfied: this.policy.patterns.symbol.test(password),
      },
    ];
  }

}

export const passwordStrengthAnalyzer = new PasswordStrengthAnalyzer();
