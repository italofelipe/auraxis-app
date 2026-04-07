import type { GoalListResponse } from "@/features/goals/contracts";

export const goalListFixture: GoalListResponse = {
  goals: [
    {
      id: "goal-1",
      title: "Reserva de emergencia",
      currentAmount: 18000,
      targetAmount: 30000,
      targetDate: "2026-12-31",
      status: "in_progress",
    },
  ],
};
