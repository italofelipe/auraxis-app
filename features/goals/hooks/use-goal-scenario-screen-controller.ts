import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";

import { useLocalSearchParams, useRouter } from "expo-router";

import { appRoutes } from "@/core/navigation/routes";
import type { GoalProjection, GoalRecord } from "@/features/goals/contracts";
import {
  useGoalProjectionQuery,
  useGoalsQuery,
} from "@/features/goals/hooks/use-goals-query";
import { useUpdateGoalMutation } from "@/features/goals/hooks/use-goals-mutations";
import {
  projectGoalScenario,
  projectedCompletionDate,
  type GoalProjectionScenario,
} from "@/features/goals/services/goal-scenario-projector";

const DEFAULT_HORIZON_MONTHS = 24;
const DEFAULT_ANNUAL_RATE_PCT = 8;

export interface GoalScenarioForm {
  readonly monthlyContribution: number;
  readonly horizonMonths: number;
  readonly annualReturnRatePct: number;
}

export interface GoalScenarioScreenController {
  readonly goalId: string | null;
  readonly goal: GoalRecord | null;
  readonly baseline: GoalProjection | null;
  readonly form: GoalScenarioForm;
  readonly scenario: GoalProjectionScenario;
  readonly projectedCompletionDate: string | null;
  readonly hasInitialised: boolean;
  readonly isLoadingGoals: boolean;
  readonly isLoadingProjection: boolean;
  readonly isSaving: boolean;
  readonly saveError: unknown | null;
  readonly setMonthlyContribution: (value: number) => void;
  readonly setHorizonMonths: (value: number) => void;
  readonly setAnnualReturnRatePct: (value: number) => void;
  readonly handleSaveTargetDate: () => void;
  readonly handleResetToBaseline: () => void;
  readonly handleBack: () => void;
}

const stringOrNull = (raw: unknown): string | null => {
  if (typeof raw !== "string") {
    return null;
  }
  const trimmed = raw.trim();
  return trimmed.length === 0 ? null : trimmed;
};

const baselineFormFromProjection = (
  projection: GoalProjection | null,
): GoalScenarioForm => {
  const monthly = projection?.assumptions.monthlyContribution ?? 0;
  const annualRate = projection?.assumptions.annualReturnRate ?? null;
  return {
    monthlyContribution: Math.max(0, monthly ?? 0),
    horizonMonths: DEFAULT_HORIZON_MONTHS,
    annualReturnRatePct:
      typeof annualRate === "number" ? annualRate : DEFAULT_ANNUAL_RATE_PCT,
  };
};

interface FormSetters {
  readonly setMonthlyContribution: (value: number) => void;
  readonly setHorizonMonths: (value: number) => void;
  readonly setAnnualReturnRatePct: (value: number) => void;
}

const useFormSetters = (
  setForm: Dispatch<SetStateAction<GoalScenarioForm>>,
): FormSetters => {
  const setMonthlyContribution = useCallback(
    (value: number): void => {
      setForm((prev) => ({ ...prev, monthlyContribution: Math.max(0, value) }));
    },
    [setForm],
  );
  const setHorizonMonths = useCallback(
    (value: number): void => {
      setForm((prev) => ({ ...prev, horizonMonths: Math.max(1, Math.floor(value)) }));
    },
    [setForm],
  );
  const setAnnualReturnRatePct = useCallback(
    (value: number): void => {
      setForm((prev) => ({ ...prev, annualReturnRatePct: Math.max(0, value) }));
    },
    [setForm],
  );
  return { setMonthlyContribution, setHorizonMonths, setAnnualReturnRatePct };
};

/**
 * Reactive controller for the per-goal scenario sandbox.
 *
 * Loads the goal from the existing list cache, fetches the canonical
 * projection from the API, hydrates the form once with the baseline
 * monthly contribution and rate, then projects every keystroke locally
 * via {@link projectGoalScenario}. Persists scenario decisions back to
 * the goal by patching `targetDate` with the projected completion date
 * (the only field the existing `UpdateGoalCommand` accepts that maps to
 * the simulated outcome).
 *
 * @returns Bag with goal/baseline/form/scenario state + handlers.
 */
export function useGoalScenarioScreenController(): GoalScenarioScreenController {
  const router = useRouter();
  const params = useLocalSearchParams();
  const goalId = useMemo(() => stringOrNull(params["id"]), [params]);

  const goalsQuery = useGoalsQuery();
  const projectionQuery = useGoalProjectionQuery(goalId);
  const updateMutation = useUpdateGoalMutation();

  const goal = useMemo(() => {
    if (goalId === null || !goalsQuery.data) {
      return null;
    }
    return goalsQuery.data.goals.find((entry) => entry.id === goalId) ?? null;
  }, [goalId, goalsQuery.data]);

  const baseline = projectionQuery.data ?? null;
  const [form, setForm] = useState<GoalScenarioForm>({
    monthlyContribution: 0,
    horizonMonths: DEFAULT_HORIZON_MONTHS,
    annualReturnRatePct: DEFAULT_ANNUAL_RATE_PCT,
  });
  const [hasInitialised, setHasInitialised] = useState(false);

  useEffect(() => {
    if (hasInitialised || !projectionQuery.isSuccess) {
      return;
    }
    setForm(baselineFormFromProjection(baseline));
    setHasInitialised(true);
  }, [baseline, hasInitialised, projectionQuery.isSuccess]);

  const scenario = useMemo(
    () =>
      projectGoalScenario({
        currentAmount: goal?.currentAmount ?? 0,
        targetAmount: goal?.targetAmount ?? 0,
        monthlyContribution: form.monthlyContribution,
        annualReturnRatePct: form.annualReturnRatePct,
        horizonMonths: form.horizonMonths,
      }),
    [form, goal?.currentAmount, goal?.targetAmount],
  );

  const completionDate = useMemo(
    () => projectedCompletionDate(scenario.monthsToTarget),
    [scenario.monthsToTarget],
  );

  const setters = useFormSetters(setForm);

  const handleResetToBaseline = useCallback((): void => {
    setForm(baselineFormFromProjection(baseline));
  }, [baseline]);

  const handleSaveTargetDate = useCallback((): void => {
    if (goalId === null || completionDate === null) {
      return;
    }
    void updateMutation.mutateAsync({
      goalId,
      targetDate: completionDate,
    });
  }, [completionDate, goalId, updateMutation]);

  const handleBack = useCallback((): void => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(appRoutes.private.goals);
  }, [router]);

  return {
    goalId,
    goal,
    baseline,
    form,
    scenario,
    projectedCompletionDate: completionDate,
    hasInitialised,
    isLoadingGoals: goalsQuery.isLoading,
    isLoadingProjection: projectionQuery.isLoading,
    isSaving: updateMutation.isPending,
    saveError: updateMutation.error,
    ...setters,
    handleSaveTargetDate,
    handleResetToBaseline,
    handleBack,
  };
}
