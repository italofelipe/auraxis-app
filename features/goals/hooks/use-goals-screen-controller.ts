import { useMemo } from "react";

import { useGoalsQuery } from "@/features/goals/hooks/use-goals-query";
import {
  goalProgressCalculator,
  type GoalProgressView,
} from "@/features/goals/services/goal-progress-calculator";

export interface GoalsScreenSummary {
  readonly total: number;
  readonly active: number;
  readonly completed: number;
}

export interface GoalsScreenController {
  readonly goalsQuery: ReturnType<typeof useGoalsQuery>;
  readonly goals: readonly GoalProgressView[];
  readonly summary: GoalsScreenSummary;
}

/**
 * Builds the canonical controller for the goals screen. Decorates the raw
 * goals list with progress information and exposes a small summary suitable
 * for the screen header.
 */
export function useGoalsScreenController(): GoalsScreenController {
  const goalsQuery = useGoalsQuery();

  const goals = useMemo<readonly GoalProgressView[]>(() => {
    const records = goalsQuery.data?.goals ?? [];
    return goalProgressCalculator.mapAll(records);
  }, [goalsQuery.data]);

  const summary = useMemo<GoalsScreenSummary>(() => {
    return {
      total: goals.length,
      active: goals.filter((goal) => !goal.isCompleted).length,
      completed: goals.filter((goal) => goal.isCompleted).length,
    };
  }, [goals]);

  return {
    goalsQuery,
    goals,
    summary,
  };
}
