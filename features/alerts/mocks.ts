import type {
  AlertListResponse,
  AlertPreferenceListResponse,
} from "@/features/alerts/contracts";

export const alertListFixture: AlertListResponse = {
  alerts: [
    {
      id: "alert-1",
      userId: "a6b9a8d2-7d50-47f5-954e-fc8cbb5825aa",
      category: "transaction_due_7d",
      status: "unread",
      entityType: "transaction",
      entityId: "trx-1",
      triggeredAt: "2026-04-07T10:00:00+00:00",
      sentAt: "2026-04-07T10:00:02+00:00",
      createdAt: "2026-04-07T10:00:00+00:00",
    },
  ],
};

export const alertPreferenceListFixture: AlertPreferenceListResponse = {
  preferences: [
    {
      id: "pref-1",
      userId: "a6b9a8d2-7d50-47f5-954e-fc8cbb5825aa",
      category: "transaction_due_7d",
      enabled: true,
      globalOptOut: false,
      updatedAt: "2026-04-07T10:00:00+00:00",
    },
  ],
};
