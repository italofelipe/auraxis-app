import { useMemo, useState } from "react";

import { useDashboardOverviewQuery, useDashboardTrendsQuery } from "@/features/dashboard/hooks/use-dashboard-overview-query";

export interface DashboardMonthOption {
  readonly value: string;
  readonly label: string;
}

export interface DashboardMonthSnapshot {
  readonly month: string;
  readonly incomes: number;
  readonly expenses: number;
  readonly balance: number;
}

export interface DashboardScreenController {
  readonly overviewQuery: ReturnType<typeof useDashboardOverviewQuery>;
  readonly trendsQuery: ReturnType<typeof useDashboardTrendsQuery>;
  readonly selectedMonth: string;
  readonly monthOptions: DashboardMonthOption[];
  readonly monthSnapshot: DashboardMonthSnapshot | null;
  readonly currentBalance: number;
  readonly setSelectedMonth: (month: string) => void;
}

const monthFormatter = new Intl.DateTimeFormat("pt-BR", {
  month: "long",
  year: "numeric",
});

const formatMonth = (month: string): string => {
  return monthFormatter.format(new Date(`${month}-01T00:00:00.000Z`));
};

const getCurrentMonth = (): string => {
  return new Date().toISOString().slice(0, 7);
};

/**
 * Builds the canonical controller for the dashboard overview screen.
 *
 * @returns Normalized dashboard bindings for view-only consumption.
 */
export function useDashboardScreenController(): DashboardScreenController {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth);
  const overviewQuery = useDashboardOverviewQuery({ month: selectedMonth });
  const trendsQuery = useDashboardTrendsQuery(6);

  const monthOptions = useMemo<DashboardMonthOption[]>(() => {
    return trendsQuery.data?.series.map((item) => ({
      value: item.month,
      label: formatMonth(item.month),
    })) ?? [];
  }, [trendsQuery.data]);

  const monthSnapshot = useMemo<DashboardMonthSnapshot | null>(() => {
    const found = trendsQuery.data?.series.find((item) => item.month === selectedMonth);

    if (!found) {
      return trendsQuery.data?.series[0]
        ? {
            month: trendsQuery.data.series[0].month,
            incomes: trendsQuery.data.series[0].income,
            expenses: trendsQuery.data.series[0].expenses,
            balance: trendsQuery.data.series[0].balance,
          }
        : null;
    }

    return {
      month: found.month,
      incomes: found.income,
      expenses: found.expenses,
      balance: found.balance,
    };
  }, [selectedMonth, trendsQuery.data]);

  return {
    overviewQuery,
    trendsQuery,
    selectedMonth,
    monthOptions,
    monthSnapshot,
    currentBalance: overviewQuery.data?.totals.balance ?? 0,
    setSelectedMonth,
  };
}
