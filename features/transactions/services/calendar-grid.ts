/**
 * Pure calendar layout helpers for the in-house FinancialCalendar.
 *
 * Returning plain data keeps the rendering layer simple (no math in
 * components) and makes the layout fully unit-testable.
 */

export interface CalendarMonth {
  /** Year of the visible page. */
  readonly year: number;
  /** Month index (1–12) of the visible page. */
  readonly month: number;
  /** Six rows of seven days, padded with neighbouring-month days. */
  readonly weeks: readonly (readonly CalendarCell[])[];
}

export interface CalendarCell {
  /** ISO `YYYY-MM-DD`. */
  readonly day: string;
  /** Day of the month (1–31). */
  readonly dayOfMonth: number;
  /** Whether this cell belongs to the visible page. */
  readonly inMonth: boolean;
}

const pad = (value: number): string => value.toString().padStart(2, "0");

const buildIso = (year: number, month: number, day: number): string => {
  return `${year}-${pad(month)}-${pad(day)}`;
};

const daysInMonth = (year: number, month: number): number => {
  // `new Date(year, month, 0)` gives the last day of the previous month
  // when called with a 1-indexed month (i.e. Feb is `new Date(y, 2, 0)`).
  return new Date(year, month, 0).getDate();
};

/**
 * Builds the canonical 6x7 grid for a given month, padding with the
 * trailing days of the previous month and the leading days of the
 * next so the layout is always rectangular.
 */
// eslint-disable-next-line max-statements
export const buildCalendarMonth = (
  year: number,
  month: number,
): CalendarMonth => {
  // First day of the visible month, 0 = Sunday.
  const firstWeekday = new Date(year, month - 1, 1).getDay();

  const totalDays = daysInMonth(year, month);
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const prevTotal = daysInMonth(prevYear, prevMonth);

  const cells: CalendarCell[] = [];

  // Trailing days of the previous month.
  for (let i = firstWeekday - 1; i >= 0; i -= 1) {
    const dayOfMonth = prevTotal - i;
    cells.push({
      day: buildIso(prevYear, prevMonth, dayOfMonth),
      dayOfMonth,
      inMonth: false,
    });
  }

  // Days of the visible month.
  for (let day = 1; day <= totalDays; day += 1) {
    cells.push({
      day: buildIso(year, month, day),
      dayOfMonth: day,
      inMonth: true,
    });
  }

  // Leading days of the next month — pad to 42 cells.
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  let nextDay = 1;
  while (cells.length < 42) {
    cells.push({
      day: buildIso(nextYear, nextMonth, nextDay),
      dayOfMonth: nextDay,
      inMonth: false,
    });
    nextDay += 1;
  }

  const weeks: CalendarCell[][] = [];
  for (let row = 0; row < 6; row += 1) {
    weeks.push(cells.slice(row * 7, row * 7 + 7));
  }

  return { year, month, weeks };
};

/**
 * Step the visible month by `delta` (typically -1 or +1). Wraps the
 * year boundary so `goToMonth(2026, 12, 1)` returns Jan 2027.
 */
export const stepMonth = (
  year: number,
  month: number,
  delta: number,
): { readonly year: number; readonly month: number } => {
  const total = year * 12 + (month - 1) + delta;
  return {
    year: Math.floor(total / 12),
    month: (((total % 12) + 12) % 12) + 1,
  };
};
