import type {
  DashboardOverview,
  DashboardTrends,
} from "@/features/dashboard/contracts";

export const dashboardOverviewFixture: DashboardOverview = {
  month: "2026-04",
  totals: {
    incomeTotal: 18250,
    expenseTotal: 9180,
    balance: 9070,
  },
  counts: {
    totalTransactions: 18,
    incomeTransactions: 4,
    expenseTransactions: 14,
    status: {
      paid: 11,
      pending: 7,
    },
  },
  topCategories: {
    expense: [
      {
        tagId: "tag-housing",
        categoryName: "Moradia",
        totalAmount: 3200,
        transactionsCount: 4,
      },
    ],
    income: [
      {
        tagId: null,
        categoryName: "Receitas",
        totalAmount: 18250,
        transactionsCount: 4,
      },
    ],
  },
};

export const dashboardTrendsFixture: DashboardTrends = {
  months: 6,
  series: [
    {
      month: "2025-11",
      income: 17000,
      expenses: 9200,
      balance: 7800,
    },
    {
      month: "2025-12",
      income: 17100,
      expenses: 8800,
      balance: 8300,
    },
    {
      month: "2026-01",
      income: 17600,
      expenses: 9100,
      balance: 8500,
    },
    {
      month: "2026-02",
      income: 17850,
      expenses: 9500,
      balance: 8350,
    },
    {
      month: "2026-03",
      income: 18010,
      expenses: 9050,
      balance: 8960,
    },
    {
      month: "2026-04",
      income: 18250,
      expenses: 9180,
      balance: 9070,
    },
  ],
};
