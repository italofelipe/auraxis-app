import { useMemo } from "react";

import { useLocalSearchParams, useRouter } from "expo-router";

import { buildGoalScenarioPath } from "@/core/navigation/routes";
import { useGoalsQuery } from "@/features/goals/hooks/use-goals-query";
import {
  goalProgressCalculator,
  type GoalProgressView,
} from "@/features/goals/services/goal-progress-calculator";

export interface UseGoalDetailScreenControllerOptions {
  /** Overrides the route param — used in tests. */
  readonly goalId?: string;
}

export interface GoalDetailScreenController {
  readonly goalId: string;
  readonly goalsQuery: ReturnType<typeof useGoalsQuery>;
  readonly goal: GoalProgressView | null;
  readonly targetDateLabel: string;
  readonly notFound: boolean;
  readonly handleSimulate: () => void;
  readonly handleBack: () => void;
}

const resolveStringParam = (value: string | string[] | undefined): string => {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }
  return value ?? "";
};

const formatTargetDate = (value: string | null): string => {
  if (!value) {
    return "Sem prazo";
  }
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

/**
 * Orchestrates the goal detail screen. Resolves the goal id from the route
 * (or injected option), finds it in the goals list query, decorates it with
 * progress math and exposes navigation to the simulator and back. The screen
 * stays view-only.
 */
export function useGoalDetailScreenController(
  options: UseGoalDetailScreenControllerOptions = {},
): GoalDetailScreenController {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const goalId = options.goalId ?? resolveStringParam(params.id);
  const goalsQuery = useGoalsQuery();

  const goal = useMemo<GoalProgressView | null>(() => {
    const record = goalsQuery.data?.goals.find((item) => item.id === goalId);
    return record ? goalProgressCalculator.calculate(record) : null;
  }, [goalsQuery.data, goalId]);

  return {
    goalId,
    goalsQuery,
    goal,
    targetDateLabel: formatTargetDate(goal?.targetDate ?? null),
    notFound: !goalsQuery.isLoading && goal === null,
    handleSimulate: () => router.push(buildGoalScenarioPath(goalId)),
    handleBack: () => router.back(),
  };
}
