export interface MonthlySnapshot {
  readonly month: string;
  readonly incomes: number;
  readonly expenses: number;
  readonly balance: number;
}

export interface DashboardOverview {
  readonly currentBalance: number;
  readonly monthly: MonthlySnapshot[];
}
