import type { AxiosInstance } from "axios";

import { httpClient } from "@/lib/http-client";
import type {
  CreateGoalFromInstallmentVsCashDto,
  CreateGoalFromInstallmentVsCashResponseDto,
  CreateInstallmentVsCashGoalPayload,
  CreateInstallmentVsCashPlannedExpensePayload,
  CreatePlannedExpenseFromInstallmentVsCashDto,
  CreatePlannedExpenseFromInstallmentVsCashResponseDto,
  InstallmentVsCashAssumptionsDto,
  InstallmentVsCashCalculation,
  InstallmentVsCashCalculationRequestDto,
  InstallmentVsCashCalculationResponseDto,
  InstallmentVsCashComparisonDto,
  InstallmentVsCashGoalBridgeResponse,
  InstallmentVsCashHistoryResponseDto,
  InstallmentVsCashIndicatorSnapshotDto,
  InstallmentVsCashNormalizedInput,
  InstallmentVsCashNormalizedInputDto,
  InstallmentVsCashPlannedExpenseBridgeResponse,
  InstallmentVsCashResult,
  InstallmentVsCashResultDto,
  InstallmentVsCashSavedCalculation,
  InstallmentVsCashSavedSimulation,
  InstallmentVsCashSavedSimulationDto,
  InstallmentVsCashSaveResponseDto,
  InstallmentVsCashScheduleItemDto,
} from "@/types/contracts/installment-vs-cash";

interface InstallmentVsCashApiClient {
  readonly get: AxiosInstance["get"];
  readonly post: AxiosInstance["post"];
}

const parseDecimalString = (value: string): number => {
  return Number.parseFloat(value);
};

const mapNormalizedInput = (
  dto: InstallmentVsCashNormalizedInputDto,
): InstallmentVsCashNormalizedInput => ({
  cashPrice: parseDecimalString(dto.cash_price),
  installmentCount: dto.installment_count,
  installmentAmount: parseDecimalString(dto.installment_amount),
  installmentTotal: parseDecimalString(dto.installment_total),
  firstPaymentDelayDays: dto.first_payment_delay_days,
  opportunityRateType: dto.opportunity_rate_type,
  opportunityRateAnnual: parseDecimalString(dto.opportunity_rate_annual),
  inflationRateAnnual: parseDecimalString(dto.inflation_rate_annual),
  feesUpfront: parseDecimalString(dto.fees_upfront),
  scenarioLabel: dto.scenario_label ?? null,
});

const mapComparison = (dto: InstallmentVsCashComparisonDto) => ({
  cashOptionTotal: parseDecimalString(dto.cash_option_total),
  installmentOptionTotal: parseDecimalString(dto.installment_option_total),
  installmentPresentValue: parseDecimalString(dto.installment_present_value),
  installmentRealValueToday: parseDecimalString(dto.installment_real_value_today),
  presentValueDeltaVsCash: parseDecimalString(dto.present_value_delta_vs_cash),
  absoluteDeltaVsCash: parseDecimalString(dto.absolute_delta_vs_cash),
  relativeDeltaVsCashPercent: parseDecimalString(dto.relative_delta_vs_cash_percent),
  breakEvenDiscountPercent: parseDecimalString(dto.break_even_discount_percent),
  breakEvenOpportunityRateAnnual: parseDecimalString(
    dto.break_even_opportunity_rate_annual,
  ),
});

const mapAssumptions = (dto: InstallmentVsCashAssumptionsDto) => ({
  opportunityRateType: dto.opportunity_rate_type,
  opportunityRateAnnualPercent: parseDecimalString(
    dto.opportunity_rate_annual_percent,
  ),
  inflationRateAnnualPercent: parseDecimalString(dto.inflation_rate_annual_percent),
  periodicity: dto.periodicity,
  firstPaymentDelayDays: dto.first_payment_delay_days,
  upfrontFeesApplyTo: dto.upfront_fees_apply_to,
  neutralityRule: dto.neutrality_rule,
});

const mapIndicatorSnapshot = (
  dto: InstallmentVsCashIndicatorSnapshotDto | null,
) => {
  if (dto === null) {
    return null;
  }

  return {
    presetType: dto.preset_type,
    source: dto.source,
    annualRatePercent: parseDecimalString(dto.annual_rate_percent),
    asOf: dto.as_of,
  };
};

const mapScheduleItem = (dto: InstallmentVsCashScheduleItemDto) => ({
  installmentNumber: dto.installment_number,
  dueInDays: dto.due_in_days,
  amount: parseDecimalString(dto.amount),
  presentValue: parseDecimalString(dto.present_value),
  realValueToday: parseDecimalString(dto.real_value_today),
  cumulativeNominal: parseDecimalString(dto.cumulative_nominal),
  cumulativePresentValue: parseDecimalString(dto.cumulative_present_value),
  cumulativeRealValueToday: parseDecimalString(dto.cumulative_real_value_today),
  cashCumulative: parseDecimalString(dto.cash_cumulative),
});

const mapResult = (dto: InstallmentVsCashResultDto): InstallmentVsCashResult => ({
  recommendedOption: dto.recommended_option,
  recommendationReason: dto.recommendation_reason,
  formulaExplainer: dto.formula_explainer,
  comparison: mapComparison(dto.comparison),
  options: {
    cash: {
      total: parseDecimalString(dto.options.cash.total),
    },
    installment: {
      count: dto.options.installment.count,
      amounts: dto.options.installment.amounts.map(parseDecimalString),
      installmentAmount: parseDecimalString(dto.options.installment.installment_amount),
      nominalTotal: parseDecimalString(dto.options.installment.nominal_total),
      upfrontFees: parseDecimalString(dto.options.installment.upfront_fees),
      firstPaymentDelayDays: dto.options.installment.first_payment_delay_days,
    },
  },
  neutralityBand: {
    absoluteBrl: parseDecimalString(dto.neutrality_band.absolute_brl),
    relativePercent: parseDecimalString(dto.neutrality_band.relative_percent),
  },
  assumptions: mapAssumptions(dto.assumptions),
  indicatorSnapshot: mapIndicatorSnapshot(dto.indicator_snapshot),
  schedule: dto.schedule.map(mapScheduleItem),
});

const mapSavedSimulation = (
  dto: InstallmentVsCashSavedSimulationDto,
): InstallmentVsCashSavedSimulation => ({
  id: dto.id,
  userId: dto.user_id,
  toolId: dto.tool_id,
  ruleVersion: dto.rule_version,
  inputs: mapNormalizedInput(dto.inputs),
  result: mapResult(dto.result),
  saved: dto.saved,
  goalId: dto.goal_id,
  createdAt: dto.created_at,
});

const mapCalculation = (
  dto: InstallmentVsCashCalculationResponseDto,
): InstallmentVsCashCalculation => ({
  toolId: dto.tool_id,
  ruleVersion: dto.rule_version,
  input: mapNormalizedInput(dto.input),
  result: mapResult(dto.result),
});

const createGoalBody = (
  payload: CreateInstallmentVsCashGoalPayload,
): CreateGoalFromInstallmentVsCashDto => ({
  title: payload.title,
  selected_option: payload.selectedOption,
  description: payload.description,
  category: payload.category,
  target_date: payload.targetDate,
  priority: payload.priority,
  current_amount: payload.currentAmount?.toFixed(2),
});

const mapGoalBridgeResponse = (
  dto: CreateGoalFromInstallmentVsCashResponseDto,
): InstallmentVsCashGoalBridgeResponse => ({
  goal: {
    id: dto.goal.id,
    title: dto.goal.title,
    description: dto.goal.description,
    category: dto.goal.category,
    targetAmount: parseDecimalString(dto.goal.target_amount),
    currentAmount: parseDecimalString(dto.goal.current_amount),
    priority: dto.goal.priority,
    targetDate: dto.goal.target_date,
    status: dto.goal.status,
    createdAt: dto.goal.created_at,
    updatedAt: dto.goal.updated_at,
  },
  simulation: mapSavedSimulation(dto.simulation),
});

const createPlannedExpenseBody = (
  payload: CreateInstallmentVsCashPlannedExpensePayload,
): CreatePlannedExpenseFromInstallmentVsCashDto => ({
  title: payload.title,
  selected_option: payload.selectedOption,
  description: payload.description,
  observation: payload.observation,
  due_date: payload.dueDate,
  first_due_date: payload.firstDueDate,
  upfront_due_date: payload.upfrontDueDate,
  tag_id: payload.tagId,
  account_id: payload.accountId,
  credit_card_id: payload.creditCardId,
  currency: payload.currency ?? "BRL",
  status: payload.status ?? "pending",
});

const mapPlannedExpenseBridgeResponse = (
  dto: CreatePlannedExpenseFromInstallmentVsCashResponseDto,
): InstallmentVsCashPlannedExpenseBridgeResponse => ({
  transactions: dto.transactions.map((transaction) => ({
    id: transaction.id,
    title: transaction.title,
    amount: parseDecimalString(transaction.amount),
    type: transaction.type,
    dueDate: transaction.due_date,
    startDate: transaction.start_date,
    endDate: transaction.end_date,
    description: transaction.description,
    observation: transaction.observation,
    isRecurring: transaction.is_recurring,
    isInstallment: transaction.is_installment,
    installmentCount: transaction.installment_count,
    tagId: transaction.tag_id,
    accountId: transaction.account_id,
    creditCardId: transaction.credit_card_id,
    status: transaction.status,
    currency: transaction.currency,
    createdAt: transaction.created_at,
    updatedAt: transaction.updated_at,
  })),
  simulation: mapSavedSimulation(dto.simulation),
});

export const createInstallmentVsCashApi = (
  client: InstallmentVsCashApiClient,
) => {
  return {
    calculate: async (
      payload: InstallmentVsCashCalculationRequestDto,
    ): Promise<InstallmentVsCashCalculation> => {
      const response = await client.post<InstallmentVsCashCalculationResponseDto>(
        "/simulations/installment-vs-cash/calculate",
        payload,
      );
      return mapCalculation(response.data);
    },
    save: async (
      payload: InstallmentVsCashCalculationRequestDto,
    ): Promise<InstallmentVsCashSavedCalculation> => {
      const response = await client.post<InstallmentVsCashSaveResponseDto>(
        "/simulations/installment-vs-cash/save",
        payload,
      );
      return {
        simulation: mapSavedSimulation(response.data.simulation),
        calculation: mapCalculation(response.data.calculation),
      };
    },
    listSaved: async (
      page = 1,
      perPage = 10,
    ): Promise<readonly InstallmentVsCashSavedSimulation[]> => {
      const response = await client.get<InstallmentVsCashHistoryResponseDto>(
        "/simulations",
        {
          params: {
            page,
            per_page: perPage,
          },
        },
      );
      return response.data.items.map(mapSavedSimulation);
    },
    createGoalFromSimulation: async (
      simulationId: string,
      payload: CreateInstallmentVsCashGoalPayload,
    ): Promise<InstallmentVsCashGoalBridgeResponse> => {
      const response =
        await client.post<CreateGoalFromInstallmentVsCashResponseDto>(
          `/simulations/${simulationId}/goal`,
          createGoalBody(payload),
        );
      return mapGoalBridgeResponse(response.data);
    },
    createPlannedExpenseFromSimulation: async (
      simulationId: string,
      payload: CreateInstallmentVsCashPlannedExpensePayload,
    ): Promise<InstallmentVsCashPlannedExpenseBridgeResponse> => {
      const response =
        await client.post<CreatePlannedExpenseFromInstallmentVsCashResponseDto>(
          `/simulations/${simulationId}/planned-expense`,
          createPlannedExpenseBody(payload),
        );
      return mapPlannedExpenseBridgeResponse(response.data);
    },
  };
};

export const installmentVsCashApi = createInstallmentVsCashApi(httpClient);
