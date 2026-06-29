import type { TransactionRecord } from "@/features/transactions/contracts";
import {
  OVERDUE_THRESHOLD_DAYS,
  isOverdueByAtLeastDays,
  selectOverdueCandidates,
} from "@/features/payments-assistant/services/payment-assistant-eligibility";

const makeTransaction = (overrides: Partial<TransactionRecord> = {}): TransactionRecord => ({
  id: "tx-1",
  title: "Aluguel",
  amount: "1200.00",
  type: "expense",
  dueDate: "2026-05-01",
  startDate: null,
  endDate: null,
  description: null,
  observation: null,
  isRecurring: false,
  isInstallment: false,
  installmentCount: null,
  recurrenceInterval: 1,
  recurrenceUnit: "month",
  tagId: null,
  accountId: null,
  creditCardId: null,
  status: "pending",
  currency: "BRL",
  source: "manual",
  externalId: null,
  bankName: null,
  installmentGroupId: null,
  paidAt: null,
  createdAt: "2026-04-01T00:00:00Z",
  updatedAt: null,
  ...overrides,
});

const TODAY = new Date(2026, 5, 29); // 2026-06-29 (local)

describe("isOverdueByAtLeastDays", () => {
  it("is true for a due date older than the threshold", () => {
    expect(isOverdueByAtLeastDays("2026-04-01", 30, TODAY)).toBe(true);
  });

  it("is true exactly on the cutoff boundary (today - days)", () => {
    expect(isOverdueByAtLeastDays("2026-05-30", 30, TODAY)).toBe(true);
  });

  it("is false one day inside the threshold window", () => {
    expect(isOverdueByAtLeastDays("2026-05-31", 30, TODAY)).toBe(false);
  });

  it("is false for a future due date", () => {
    expect(isOverdueByAtLeastDays("2026-07-15", 30, TODAY)).toBe(false);
  });
});

describe("selectOverdueCandidates", () => {
  it("keeps only pending/postponed transactions overdue beyond the threshold", () => {
    const transactions = [
      makeTransaction({ id: "pending-old", status: "pending", dueDate: "2026-04-10" }),
      makeTransaction({ id: "postponed-old", status: "postponed", dueDate: "2026-03-20" }),
      makeTransaction({ id: "paid-old", status: "paid", dueDate: "2026-04-10" }),
      makeTransaction({ id: "cancelled-old", status: "cancelled", dueDate: "2026-04-10" }),
      makeTransaction({ id: "pending-recent", status: "pending", dueDate: "2026-06-20" }),
    ];

    const result = selectOverdueCandidates(transactions, TODAY);

    expect(result.map((t) => t.id)).toEqual(["postponed-old", "pending-old"]);
  });

  it("sorts by due date ascending (oldest first)", () => {
    const transactions = [
      makeTransaction({ id: "b", status: "pending", dueDate: "2026-04-15" }),
      makeTransaction({ id: "a", status: "pending", dueDate: "2026-02-01" }),
      makeTransaction({ id: "c", status: "pending", dueDate: "2026-05-01" }),
    ];

    expect(selectOverdueCandidates(transactions, TODAY).map((t) => t.id)).toEqual(["a", "b", "c"]);
  });

  it("returns an empty array when nothing qualifies", () => {
    const transactions = [
      makeTransaction({ status: "paid", dueDate: "2026-01-01" }),
      makeTransaction({ status: "pending", dueDate: "2026-06-28" }),
    ];

    expect(selectOverdueCandidates(transactions, TODAY)).toEqual([]);
  });

  it("exposes a 30-day default threshold", () => {
    expect(OVERDUE_THRESHOLD_DAYS).toBe(30);
  });
});
