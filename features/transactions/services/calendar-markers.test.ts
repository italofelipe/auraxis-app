import {
  buildCalendarMarkers,
  transactionsForDay,
  type CalendarTheme,
} from "@/features/transactions/services/calendar-markers";

const theme: CalendarTheme = {
  income: "#1f9d55",
  expense: "#c53030",
  planned: "#d97706",
};

interface TxArgs {
  readonly id: string;
  readonly dueDate: string;
  readonly type: "income" | "expense";
  readonly status: string;
}

const tx = (args: TxArgs) =>
  ({
    id: args.id,
    title: `tx-${args.id}`,
    amount: "10",
    type: args.type,
    dueDate: args.dueDate,
    status: args.status,
  }) as never;

describe("buildCalendarMarkers", () => {
  it("returns empty map when no transactions land on a day", () => {
    expect(buildCalendarMarkers([], theme)).toEqual({});
  });

  it("groups transactions by ISO day and dedupes dot kinds", () => {
    const result = buildCalendarMarkers(
      [
        tx({ id: "1", dueDate: "2026-04-15T00:00:00.000Z", type: "income", status: "paid" }),
        tx({ id: "2", dueDate: "2026-04-15T00:00:00.000Z", type: "income", status: "paid" }),
        tx({ id: "3", dueDate: "2026-04-15T00:00:00.000Z", type: "expense", status: "paid" }),
        tx({ id: "4", dueDate: "2026-04-16T00:00:00.000Z", type: "expense", status: "pending" }),
      ],
      theme,
    );
    expect(result["2026-04-15"]?.count).toBe(3);
    expect(result["2026-04-15"]?.dots.map((d) => d.key).sort()).toEqual([
      "expense",
      "income",
    ]);
    expect(result["2026-04-16"]?.dots).toEqual([
      { key: "planned", color: theme.planned },
    ]);
  });

  it("treats non-paid transactions as planned regardless of type", () => {
    const result = buildCalendarMarkers(
      [tx({ id: "1", dueDate: "2026-04-20T00:00:00.000Z", type: "income", status: "pending" })],
      theme,
    );
    expect(result["2026-04-20"]?.dots).toEqual([
      { key: "planned", color: theme.planned },
    ]);
  });
});

describe("transactionsForDay", () => {
  it("returns only transactions with the matching ISO day", () => {
    const items = [
      tx({ id: "1", dueDate: "2026-04-15T00:00:00.000Z", type: "income", status: "paid" }),
      tx({ id: "2", dueDate: "2026-04-16T00:00:00.000Z", type: "expense", status: "paid" }),
    ];
    expect(transactionsForDay(items, "2026-04-15").map((t) => t.id)).toEqual(["1"]);
  });
});
