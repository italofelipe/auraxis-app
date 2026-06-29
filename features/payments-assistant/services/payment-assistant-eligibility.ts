/**
 * Pure eligibility rules for the Payments Assistant.
 *
 * Surfaces transactions that are still "open" (pending/postponed) and overdue by
 * at least {@link OVERDUE_THRESHOLD_DAYS} days so the user can clear the backlog.
 * Pure (no React, no fetch) — trivially unit-testable.
 */

import type { TransactionRecord, TransactionStatus } from "@/features/transactions/contracts";

/** A transaction must be overdue by at least this many days to qualify. */
export const OVERDUE_THRESHOLD_DAYS = 30;

/** Statuses considered "open" (still actionable) by the assistant. */
const ELIGIBLE_STATUSES: ReadonlySet<TransactionStatus> = new Set<TransactionStatus>([
  "pending",
  "postponed",
]);

/**
 * Formats a Date as a local `YYYY-MM-DD` calendar date.
 *
 * @param date Date to format.
 * @returns ISO calendar-date string.
 */
const toIsoDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/**
 * Whether a `dueDate` is overdue by at least `days` days relative to `today`.
 *
 * Calendar-date comparison only (lexicographic on `YYYY-MM-DD`). A due date
 * exactly on the cutoff (`today - days`) counts as overdue.
 *
 * @param dueDate Due date as `YYYY-MM-DD`.
 * @param days Minimum number of days overdue.
 * @param today Reference "now" date.
 * @returns True when `dueDate <= today - days`.
 */
export const isOverdueByAtLeastDays = (dueDate: string, days: number, today: Date): boolean => {
  const cutoff = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  cutoff.setDate(cutoff.getDate() - days);
  return dueDate <= toIsoDate(cutoff);
};

/**
 * Selects the transactions the assistant should present, oldest due date first.
 *
 * @param transactions Full set of candidate transactions.
 * @param today Reference "now" date.
 * @param thresholdDays Overdue threshold (defaults to {@link OVERDUE_THRESHOLD_DAYS}).
 * @returns Filtered, sorted list of overdue open transactions.
 */
export const selectOverdueCandidates = (
  transactions: readonly TransactionRecord[],
  today: Date,
  thresholdDays: number = OVERDUE_THRESHOLD_DAYS,
): TransactionRecord[] =>
  transactions
    .filter(
      (transaction) =>
        ELIGIBLE_STATUSES.has(transaction.status) &&
        isOverdueByAtLeastDays(transaction.dueDate, thresholdDays, today),
    )
    .slice()
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
