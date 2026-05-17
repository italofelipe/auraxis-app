import type {
  GoalCreatedAnalyticsProperties,
  GoalSimulatedAnalyticsProperties,
} from "@/core/observability/analytics-types";
import type { GoalRecord, SimulatedGoalPlan } from "@/features/goals/contracts";

const bucketAmount = (amount: number | null | undefined): string => {
  if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
    return "unknown";
  }
  if (amount < 1_000) {
    return "under_1k";
  }
  if (amount < 10_000) {
    return "1k_10k";
  }
  if (amount < 100_000) {
    return "10k_100k";
  }
  return "100k_plus";
};

export const buildGoalCreatedAnalyticsProperties = (
  goal: GoalRecord,
): GoalCreatedAnalyticsProperties => ({
  targetAmountBucket: bucketAmount(goal.targetAmount),
});

export const buildGoalSimulatedAnalyticsProperties = (
  plan: SimulatedGoalPlan,
): GoalSimulatedAnalyticsProperties => ({
  horizonMonths: plan.monthsToTarget ?? undefined,
  contributionBucket: bucketAmount(plan.monthlyContribution),
});
