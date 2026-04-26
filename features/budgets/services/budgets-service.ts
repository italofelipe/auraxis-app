import type { AxiosInstance } from "axios";

import { unwrapEnvelopeData } from "@/core/http/contracts";
import { httpClient } from "@/core/http/http-client";
import type {
  Budget,
  BudgetPeriod,
  BudgetSummary,
  CreateBudgetCommand,
  UpdateBudgetCommand,
} from "@/features/budgets/contracts";
import { apiContractMap } from "@/shared/contracts/api-contract-map";
import { resolveApiContractPath } from "@/shared/contracts/resolve-api-contract-path";

interface BudgetPayload {
  readonly id: string;
  readonly name: string;
  readonly amount: string;
  readonly spent: string;
  readonly remaining: string;
  readonly percentage_used: number;
  readonly period: BudgetPeriod;
  readonly start_date: string | null;
  readonly end_date: string | null;
  readonly tag_id: string | null;
  readonly tag_name: string | null;
  readonly tag_color: string | null;
  readonly is_active: boolean;
  readonly is_over_budget: boolean;
  readonly created_at: string;
  readonly updated_at: string;
}

interface BudgetSummaryPayload {
  readonly total_budgeted: string;
  readonly total_spent: string;
  readonly total_remaining: string;
  readonly percentage_used: number;
  readonly budget_count: number;
}

const mapBudget = (payload: BudgetPayload): Budget => ({
  id: payload.id,
  name: payload.name,
  amount: payload.amount,
  spent: payload.spent,
  remaining: payload.remaining,
  percentageUsed: payload.percentage_used,
  period: payload.period,
  startDate: payload.start_date,
  endDate: payload.end_date,
  tagId: payload.tag_id,
  tagName: payload.tag_name,
  tagColor: payload.tag_color,
  isActive: payload.is_active,
  isOverBudget: payload.is_over_budget,
  createdAt: payload.created_at,
  updatedAt: payload.updated_at,
});

const mapSummary = (payload: BudgetSummaryPayload): BudgetSummary => ({
  totalBudgeted: payload.total_budgeted,
  totalSpent: payload.total_spent,
  totalRemaining: payload.total_remaining,
  percentageUsed: payload.percentage_used,
  budgetCount: payload.budget_count,
});

const buildCreatePayload = (command: CreateBudgetCommand) => ({
  name: command.name,
  amount: command.amount,
  period: command.period ?? "monthly",
  tag_id: command.tagId ?? null,
  start_date: command.startDate ?? null,
  end_date: command.endDate ?? null,
});

const buildUpdatePayload = (command: UpdateBudgetCommand) => {
  const payload: Record<string, unknown> = {};
  if (command.name !== undefined) {payload.name = command.name;}
  if (command.amount !== undefined) {payload.amount = command.amount;}
  if (command.period !== undefined) {payload.period = command.period;}
  if (command.tagId !== undefined) {payload.tag_id = command.tagId;}
  if (command.startDate !== undefined) {payload.start_date = command.startDate;}
  if (command.endDate !== undefined) {payload.end_date = command.endDate;}
  if (command.isActive !== undefined) {payload.is_active = command.isActive;}
  return payload;
};

const unwrapList = (data: unknown): BudgetPayload[] => {
  if (Array.isArray(data)) {
    return data as BudgetPayload[];
  }
  const envelope = data as { items?: BudgetPayload[]; data?: { items?: BudgetPayload[] } };
  if (envelope.items) {
    return envelope.items;
  }
  if (envelope.data?.items) {
    return envelope.data.items;
  }
  return [];
};

export const createBudgetsService = (client: AxiosInstance) => ({
  listBudgets: async (): Promise<readonly Budget[]> => {
    const response = await client.get(apiContractMap.budgetsList.path);
    return unwrapList(response.data).map(mapBudget);
  },
  getBudget: async (budgetId: string): Promise<Budget> => {
    const response = await client.get(
      resolveApiContractPath(apiContractMap.budgetDetail.path, {
        budget_id: budgetId,
      }),
    );
    return mapBudget(unwrapEnvelopeData<BudgetPayload>(response.data));
  },
  createBudget: async (command: CreateBudgetCommand): Promise<Budget> => {
    const response = await client.post(
      apiContractMap.budgetsCreate.path,
      buildCreatePayload(command),
    );
    return mapBudget(unwrapEnvelopeData<BudgetPayload>(response.data));
  },
  updateBudget: async (command: UpdateBudgetCommand): Promise<Budget> => {
    const response = await client.patch(
      resolveApiContractPath(apiContractMap.budgetUpdate.path, {
        budget_id: command.budgetId,
      }),
      buildUpdatePayload(command),
    );
    return mapBudget(unwrapEnvelopeData<BudgetPayload>(response.data));
  },
  deleteBudget: async (budgetId: string): Promise<void> => {
    await client.delete(
      resolveApiContractPath(apiContractMap.budgetDelete.path, {
        budget_id: budgetId,
      }),
    );
  },
  getSummary: async (): Promise<BudgetSummary> => {
    const response = await client.get(apiContractMap.budgetSummary.path);
    return mapSummary(unwrapEnvelopeData<BudgetSummaryPayload>(response.data));
  },
});

export const budgetsService = createBudgetsService(httpClient);
