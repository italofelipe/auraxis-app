import type { TransactionViewModel } from "@/features/transactions/hooks/use-transactions-screen-controller";

export interface CalendarMarker {
  /** Whether at least one transaction lands on the day. */
  readonly marked: boolean;
  /**
   * Up to 3 dot colours so the day cell shows the mix of types
   * present (income green, expense red, planned amber). The
   * `react-native-calendars` multi-dot variant accepts this shape.
   */
  readonly dots: readonly CalendarDot[];
  readonly count: number;
}

export interface CalendarDot {
  readonly key: "income" | "expense" | "planned";
  readonly color: string;
}

export interface CalendarTheme {
  readonly income: string;
  readonly expense: string;
  readonly planned: string;
}

const buildDot = (
  key: CalendarDot["key"],
  theme: CalendarTheme,
): CalendarDot => {
  return { key, color: theme[key] };
};

/**
 * Groups transactions by their dueDate (YYYY-MM-DD) and produces the
 * marker map expected by `react-native-calendars` in multi-dot mode.
 *
 * Days with no transactions are absent from the result so the calendar
 * doesn't draw empty marker objects.
 *
 * @param transactions Domain view models (already mapped from the API).
 * @param theme Colour tokens for each dot type.
 * @returns Record keyed by YYYY-MM-DD with marker info per day.
 */
export const buildCalendarMarkers = (
  transactions: readonly TransactionViewModel[],
  theme: CalendarTheme,
): Record<string, CalendarMarker> => {
  const acc = new Map<string, { dots: Set<CalendarDot["key"]>; count: number }>();

  for (const tx of transactions) {
    const day = tx.dueDate.slice(0, 10);
    if (!day) {
      continue;
    }
    const key: CalendarDot["key"] =
      tx.status === "paid"
        ? tx.type === "income"
          ? "income"
          : "expense"
        : "planned";
    const entry = acc.get(day) ?? { dots: new Set(), count: 0 };
    entry.dots.add(key);
    entry.count += 1;
    acc.set(day, entry);
  }

  const result: Record<string, CalendarMarker> = {};
  for (const [day, { dots, count }] of acc.entries()) {
    result[day] = {
      marked: true,
      count,
      dots: [...dots].map((key) => buildDot(key, theme)),
    };
  }
  return result;
};

/**
 * Filters the transactions to those landing on a specific day. Used by
 * the day-detail bottom sheet inside the calendar.
 */
export const transactionsForDay = (
  transactions: readonly TransactionViewModel[],
  day: string,
): readonly TransactionViewModel[] => {
  return transactions.filter((tx) => tx.dueDate.slice(0, 10) === day);
};
