import { useMemo } from "react";

import type { GoalRecord } from "@/features/goals/contracts";
import { useGoalsQuery } from "@/features/goals/hooks/use-goals-query";

export interface GoalViewModel {
  readonly id: string;
  readonly title: string;
  readonly currentAmount: number;
  readonly targetAmount: number;
  readonly targetDate: string | null;
  readonly status: string;
  readonly progress: number;
}

export interface GoalsScreenController {
  readonly goalsQuery: ReturnType<typeof useGoalsQuery>;
  readonly goals: GoalViewModel[];
}

const toProgressPercent = (current: number, target: number): number => {
  if (target <= 0) {
    return 0;
  }

  return Math.min(100, Number(((current / target) * 100).toFixed(1)));
};

const toGoalViewModel = (goal: GoalRecord): GoalViewModel => ({
  id: goal.id,
  title: goal.title,
  currentAmount: goal.currentAmount,
  targetAmount: goal.targetAmount,
  targetDate: goal.targetDate,
  status: goal.status,
  progress: toProgressPercent(goal.currentAmount, goal.targetAmount),
});

/**
 * Creates the canonical controller for the goals screen.
 *
 * @returns Normalized goal list with progress percentages.
 */
export function useGoalsScreenController(): GoalsScreenController {
  const goalsQuery = useGoalsQuery();

  const goals = useMemo<GoalViewModel[]>(
    () => (goalsQuery.data?.goals ?? []).map(toGoalViewModel),
    [goalsQuery.data],
  );

  return {
    goalsQuery,
    goals,
  };
}
