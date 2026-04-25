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
