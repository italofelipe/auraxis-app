import type { GoalRecord } from "@/features/goals/contracts";

export interface GoalProgressView extends GoalRecord {
  readonly progress: number;
  readonly remaining: number;
  readonly isCompleted: boolean;
}

/**
 * Encapsulates the deterministic math for goal progress so the controller
 * stays orchestration-only and the calculator can be reused by any view that
 * shows goals (dashboard featured goals, goal detail, etc).
 */
export class GoalProgressCalculator {
  /**
   * @param goal - Raw goal record from the API contract.
   * @returns Decorated goal with progress %, remaining amount and completion flag.
   */
  // eslint-disable-next-line class-methods-use-this
  calculate(goal: GoalRecord): GoalProgressView {
    const target = Number.isFinite(goal.targetAmount) ? Math.max(goal.targetAmount, 0) : 0;
    const rawCurrent = Number.isFinite(goal.currentAmount) ? goal.currentAmount : 0;
    const current = Math.max(rawCurrent, 0);

    const progress = target > 0 ? Math.min(current / target, 1) * 100 : 0;
    const remaining = Math.max(target - current, 0);
    const isCompleted = goal.status === "completed" || (target > 0 && current >= target);

    return {
      ...goal,
      progress: Math.round(progress),
      remaining,
      isCompleted,
    };
  }

  /**
   * Decorates a list of goals and orders them: active first by descending
   * progress, then completed at the bottom.
   */
  mapAll(goals: readonly GoalRecord[]): readonly GoalProgressView[] {
    const decorated = goals.map((goal) => this.calculate(goal));
    return [...decorated].sort((a, b) => {
      if (a.isCompleted !== b.isCompleted) {
        return a.isCompleted ? 1 : -1;
      }
      return b.progress - a.progress;
    });
  }
}

export const goalProgressCalculator = new GoalProgressCalculator();
