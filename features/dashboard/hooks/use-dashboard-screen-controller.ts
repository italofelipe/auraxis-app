import { useMemo, useState } from "react";

import { useSessionStore } from "@/core/session/session-store";
import {
  useDashboardOverviewQuery,
  useDashboardTrendsQuery,
} from "@/features/dashboard/hooks/use-dashboard-overview-query";
import {
  savingsRateCalculator,
  type SavingsRateAssessment,
} from "@/features/dashboard/services/savings-rate-calculator";

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
  readonly savingsRate: SavingsRateAssessment | null;
  readonly greetingName: string;
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

const firstName = (fullName: string | null | undefined): string => {
  if (!fullName) return "";
  const trimmed = fullName.trim();
  if (trimmed.length === 0) return "";
  return trimmed.split(/\s+/)[0] ?? "";
};

/**
 * Builds the canonical controller for the dashboard overview screen.
 *
 * @returns Normalized dashboard bindings for view-only consumption.
 */
export function useDashboardScreenController(): DashboardScreenController {
  const userName = useSessionStore((state) => state.user?.name ?? null);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth);
  const overviewQuery = useDashboardOverviewQuery({ month: selectedMonth });
  const trendsQuery = useDashboardTrendsQuery(6);

  const monthOptions = useMemo<DashboardMonthOption[]>(() => {
    return (
      trendsQuery.data?.series.map((item) => ({
        value: item.month,
        label: formatMonth(item.month),
      })) ?? []
    );
  }, [trendsQuery.data]);

  const monthSnapshot = useMemo<DashboardMonthSnapshot | null>(() => {
    const found = trendsQuery.data?.series.find((item) => item.month === selectedMonth);
    if (found) {
      return {
        month: found.month,
        incomes: found.income,
        expenses: found.expenses,
        balance: found.balance,
      };
    }

    const fallback = trendsQuery.data?.series[0];
    if (!fallback) return null;

    return {
      month: fallback.month,
      incomes: fallback.income,
      expenses: fallback.expenses,
      balance: fallback.balance,
    };
  }, [selectedMonth, trendsQuery.data]);

  const savingsRate = useMemo<SavingsRateAssessment | null>(() => {
    if (!monthSnapshot) return null;
    return savingsRateCalculator.assess({
      incomes: monthSnapshot.incomes,
      expenses: monthSnapshot.expenses,
    });
  }, [monthSnapshot]);

  return {
    overviewQuery,
    trendsQuery,
    selectedMonth,
    monthOptions,
    monthSnapshot,
    currentBalance: overviewQuery.data?.totals.balance ?? 0,
    savingsRate,
    greetingName: firstName(userName),
    setSelectedMonth,
  };
}
