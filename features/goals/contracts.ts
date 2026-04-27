export interface GoalRecord {
  readonly id: string;
  readonly title: string;
  readonly currentAmount: number;
  readonly targetAmount: number;
  readonly targetDate: string | null;
  readonly status: string;
}

export interface GoalListResponse {
  readonly goals: GoalRecord[];
}

export type GoalSummary = GoalRecord;

export interface CreateGoalCommand {
  readonly title: string;
  readonly targetAmount: number;
  readonly currentAmount?: number;
  readonly targetDate?: string | null;
}

export interface UpdateGoalCommand {
  readonly goalId: string;
  readonly title?: string;
  readonly targetAmount?: number;
  readonly currentAmount?: number;
  readonly targetDate?: string | null;
  readonly status?: string;
}

export interface GoalDetailResponse {
  readonly goal: GoalRecord;
}

export interface GoalPlan {
  readonly goalId: string;
  readonly monthlyContribution: number;
  readonly monthsToTarget: number | null;
  readonly recommendedSavingsRate: number | null;
  readonly disclaimer: string | null;
}

export interface GoalProjection {
  readonly goalId: string;
  readonly projectedFinishDate: string | null;
  readonly projectedAmountAtTarget: number | null;
  readonly assumptions: {
    readonly annualReturnRate: number | null;
    readonly monthlyContribution: number | null;
  };
}

export interface SimulateGoalPlanCommand {
  readonly targetAmount: number;
  readonly currentAmount: number;
  readonly targetDate?: string | null;
  readonly monthlyIncome?: number | null;
  readonly monthlyExpenses?: number | null;
  readonly monthlyContribution?: number | null;
}

export interface SimulatedGoalPlan {
  readonly monthlyContribution: number;
  readonly monthsToTarget: number | null;
  readonly recommendedSavingsRate: number | null;
  readonly projectedFinishDate: string | null;
  readonly disclaimer: string | null;
}
