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
