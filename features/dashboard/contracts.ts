export interface DashboardCategoryTotal {
  readonly tagId: string | null;
  readonly categoryName: string;
  readonly totalAmount: number;
  readonly transactionsCount: number;
}

export interface DashboardOverview {
  readonly month: string;
  readonly totals: {
    readonly incomeTotal: number;
    readonly expenseTotal: number;
    readonly balance: number;
  };
  readonly counts: {
    readonly totalTransactions: number;
    readonly incomeTransactions: number;
    readonly expenseTransactions: number;
    readonly status: Record<string, number>;
  };
  readonly topCategories: {
    readonly expense: DashboardCategoryTotal[];
    readonly income: DashboardCategoryTotal[];
  };
}

export interface DashboardOverviewFilters {
  readonly month: string;
}

export interface DashboardTrendPoint {
  readonly month: string;
  readonly income: number;
  readonly expenses: number;
  readonly balance: number;
}

export interface DashboardTrends {
  readonly months: number;
  readonly series: DashboardTrendPoint[];
}
