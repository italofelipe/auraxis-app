import { http, HttpResponse } from "msw";

import { authSessionFixture } from "@/features/auth/mocks";
import { goalListFixture } from "@/features/goals/mocks";
import { transactionCollectionFixture, transactionFixture } from "@/features/transactions/mocks";
import { dashboardOverviewFixture } from "@/features/dashboard/mocks";
import type { GoalRecord } from "@/features/goals/contracts";
import type { TransactionRecord } from "@/features/transactions/contracts";

// Matches the DEFAULT_API_BASE_URL in shared/config/runtime.ts
const BASE_URL = "http://localhost:5000";

const envelope = <T>(data: T) => ({ data });

export const handlers = [
  // Auth
  http.post(`${BASE_URL}/auth/login`, () => {
    return HttpResponse.json(
      envelope({
        token: authSessionFixture.accessToken,
        refresh_token: authSessionFixture.refreshToken,
        user: {
          id: authSessionFixture.user.id,
          name: authSessionFixture.user.name,
          email: authSessionFixture.user.email,
          email_confirmed: authSessionFixture.user.emailConfirmed,
        },
      }),
    );
  }),

  http.post(`${BASE_URL}/auth/logout`, () => {
    return HttpResponse.json({ success: true });
  }),

  // Transactions
  http.get(`${BASE_URL}/transactions`, () => {
    return HttpResponse.json(envelope(transactionCollectionFixture));
  }),

  http.post(`${BASE_URL}/transactions`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    const newTx: TransactionRecord = {
      ...transactionFixture,
      id: "tx-new",
      title: String(body.title ?? "Nova transacao"),
      amount: String(body.amount ?? "100.00"),
      type: (body.type as TransactionRecord["type"]) ?? "expense",
      dueDate: String(body.due_date ?? "2026-05-01"),
      status: "pending",
      paidAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return HttpResponse.json(envelope({ transaction: newTx }), { status: 201 });
  }),

  http.patch(`${BASE_URL}/transactions/:transactionId`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    const updated: TransactionRecord = {
      ...transactionFixture,
      title: String(body.title ?? transactionFixture.title),
      updatedAt: new Date().toISOString(),
    };
    return HttpResponse.json(envelope({ transaction: updated }));
  }),

  http.delete(`${BASE_URL}/transactions/:transactionId`, () => {
    return HttpResponse.json({ success: true });
  }),

  // Goals
  http.get(`${BASE_URL}/goals`, () => {
    return HttpResponse.json(envelope(goalListFixture));
  }),

  http.post(`${BASE_URL}/goals`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    const newGoal: GoalRecord = {
      id: "goal-new",
      title: String(body.title ?? "Nova meta"),
      targetAmount: Number(body.target_amount ?? 10000),
      currentAmount: Number(body.current_amount ?? 0),
      targetDate: body.target_date ? String(body.target_date) : null,
      status: "in_progress",
    };
    return HttpResponse.json(envelope({ goal: newGoal }), { status: 201 });
  }),

  // Dashboard
  http.get(`${BASE_URL}/dashboard/overview`, () => {
    return HttpResponse.json(envelope(dashboardOverviewFixture));
  }),

  http.get(`${BASE_URL}/dashboard/trends`, () => {
    return HttpResponse.json(
      envelope({
        months: 6,
        series: [
          { month: "2026-04", income: 18250, expenses: 9180, balance: 9070 },
        ],
      }),
    );
  }),
];
