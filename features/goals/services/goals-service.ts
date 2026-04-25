import type { AxiosInstance } from "axios";

import { unwrapEnvelopeData } from "@/core/http/contracts";
import { httpClient } from "@/core/http/http-client";
import type {
  CreateGoalCommand,
  GoalListResponse,
  GoalRecord,
  UpdateGoalCommand,
} from "@/features/goals/contracts";
import { apiContractMap } from "@/shared/contracts/api-contract-map";
import { resolveApiContractPath } from "@/shared/contracts/resolve-api-contract-path";

interface GoalPayload {
  readonly id: string;
  readonly title: string;
  readonly current_amount: number;
  readonly target_amount: number;
  readonly target_date: string | null;
  readonly status: string;
}

const mapGoal = (payload: GoalPayload): GoalRecord => {
  return {
    id: payload.id,
    title: payload.title,
    currentAmount: payload.current_amount,
    targetAmount: payload.target_amount,
    targetDate: payload.target_date,
    status: payload.status,
  };
};

const buildCreatePayload = (command: CreateGoalCommand) => {
  return {
    title: command.title,
    target_amount: command.targetAmount,
    current_amount: command.currentAmount ?? 0,
    target_date: command.targetDate ?? null,
  };
};

const buildUpdatePayload = (command: UpdateGoalCommand) => {
  const payload: Record<string, unknown> = {};
  if (command.title !== undefined) {payload.title = command.title;}
  if (command.targetAmount !== undefined) {payload.target_amount = command.targetAmount;}
  if (command.currentAmount !== undefined) {payload.current_amount = command.currentAmount;}
  if (command.targetDate !== undefined) {payload.target_date = command.targetDate;}
  if (command.status !== undefined) {payload.status = command.status;}
  return payload;
};

export const createGoalsService = (client: AxiosInstance) => {
  return {
    listGoals: async (): Promise<GoalListResponse> => {
      const response = await client.get(apiContractMap.goalsList.path);
      return unwrapEnvelopeData<GoalListResponse>(response.data);
    },
    createGoal: async (command: CreateGoalCommand): Promise<GoalRecord> => {
      const response = await client.post(
        apiContractMap.goalsCreate.path,
        buildCreatePayload(command),
      );
      const payload = unwrapEnvelopeData<{ readonly goal: GoalPayload }>(response.data);
      return mapGoal(payload.goal);
    },
    updateGoal: async (command: UpdateGoalCommand): Promise<GoalRecord> => {
      const response = await client.patch(
        resolveApiContractPath(apiContractMap.goalUpdate.path, {
          goal_id: command.goalId,
        }),
        buildUpdatePayload(command),
      );
      const payload = unwrapEnvelopeData<{ readonly goal: GoalPayload }>(response.data);
      return mapGoal(payload.goal);
    },
    deleteGoal: async (goalId: string): Promise<void> => {
      await client.delete(
        resolveApiContractPath(apiContractMap.goalDelete.path, { goal_id: goalId }),
      );
    },
  };
};

export const goalsService = createGoalsService(httpClient);
