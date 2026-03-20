export type OpportunityRateType =
  | "manual"
  | "product_default"
  | "inflation_only";

export type RecommendedOption = "cash" | "installment" | "equivalent";

export type SelectedPaymentOption = "cash" | "installment";

export interface InstallmentVsCashCalculationRequestDto {
  readonly cash_price: string;
  readonly installment_count: number;
  readonly inflation_rate_annual: string;
  readonly fees_enabled: boolean;
  readonly fees_upfront: string;
  readonly first_payment_delay_days: number;
  readonly opportunity_rate_type: OpportunityRateType;
  readonly installment_amount?: string;
  readonly installment_total?: string;
  readonly opportunity_rate_annual?: string;
  readonly scenario_label?: string;
}

export type InstallmentVsCashSaveRequestDto =
  InstallmentVsCashCalculationRequestDto;

export interface InstallmentVsCashIndicatorSnapshotDto {
  readonly preset_type: string;
  readonly source: string;
  readonly annual_rate_percent: string;
  readonly as_of: string;
}

export interface InstallmentVsCashComparisonDto {
  readonly cash_option_total: string;
  readonly installment_option_total: string;
  readonly installment_present_value: string;
  readonly installment_real_value_today: string;
  readonly present_value_delta_vs_cash: string;
  readonly absolute_delta_vs_cash: string;
  readonly relative_delta_vs_cash_percent: string;
  readonly break_even_discount_percent: string;
  readonly break_even_opportunity_rate_annual: string;
}

export interface InstallmentVsCashCashOptionDto {
  readonly total: string;
}

export interface InstallmentVsCashInstallmentOptionDto {
  readonly count: number;
  readonly amounts: readonly string[];
  readonly installment_amount: string;
  readonly nominal_total: string;
  readonly upfront_fees: string;
  readonly first_payment_delay_days: number;
}

export interface InstallmentVsCashOptionsDto {
  readonly cash: InstallmentVsCashCashOptionDto;
  readonly installment: InstallmentVsCashInstallmentOptionDto;
}

export interface InstallmentVsCashNeutralityBandDto {
  readonly absolute_brl: string;
  readonly relative_percent: string;
}

export interface InstallmentVsCashAssumptionsDto {
  readonly opportunity_rate_type: OpportunityRateType;
  readonly opportunity_rate_annual_percent: string;
  readonly inflation_rate_annual_percent: string;
  readonly periodicity: string;
  readonly first_payment_delay_days: number;
  readonly upfront_fees_apply_to: string;
  readonly neutrality_rule: string;
}

export interface InstallmentVsCashScheduleItemDto {
  readonly installment_number: number;
  readonly due_in_days: number;
  readonly amount: string;
  readonly present_value: string;
  readonly real_value_today: string;
  readonly cumulative_nominal: string;
  readonly cumulative_present_value: string;
  readonly cumulative_real_value_today: string;
  readonly cash_cumulative: string;
}

export interface InstallmentVsCashResultDto {
  readonly recommended_option: RecommendedOption;
  readonly recommendation_reason: string;
  readonly formula_explainer: string;
  readonly comparison: InstallmentVsCashComparisonDto;
  readonly options: InstallmentVsCashOptionsDto;
  readonly neutrality_band: InstallmentVsCashNeutralityBandDto;
  readonly assumptions: InstallmentVsCashAssumptionsDto;
  readonly indicator_snapshot: InstallmentVsCashIndicatorSnapshotDto | null;
  readonly schedule: readonly InstallmentVsCashScheduleItemDto[];
}

export interface InstallmentVsCashNormalizedInputDto {
  readonly cash_price: string;
  readonly installment_count: number;
  readonly installment_amount: string;
  readonly installment_total: string;
  readonly first_payment_delay_days: number;
  readonly opportunity_rate_type: OpportunityRateType;
  readonly opportunity_rate_annual: string;
  readonly inflation_rate_annual: string;
  readonly fees_upfront: string;
  readonly scenario_label?: string | null;
}

export interface InstallmentVsCashCalculationResponseDto {
  readonly tool_id: string;
  readonly rule_version: string;
  readonly input: InstallmentVsCashNormalizedInputDto;
  readonly result: InstallmentVsCashResultDto;
}

export interface InstallmentVsCashSavedSimulationDto {
  readonly id: string;
  readonly user_id: string | null;
  readonly tool_id: string;
  readonly rule_version: string;
  readonly inputs: InstallmentVsCashNormalizedInputDto;
  readonly result: InstallmentVsCashResultDto;
  readonly saved: boolean;
  readonly goal_id: string | null;
  readonly created_at: string;
}

export interface InstallmentVsCashSaveResponseDto {
  readonly simulation: InstallmentVsCashSavedSimulationDto;
  readonly calculation: InstallmentVsCashCalculationResponseDto;
}

export interface InstallmentVsCashGoalDto {
  readonly id: string;
  readonly title: string;
  readonly description: string | null;
  readonly category: string | null;
  readonly target_amount: string;
  readonly current_amount: string;
  readonly priority: number;
  readonly target_date: string | null;
  readonly status: string;
  readonly created_at: string | null;
  readonly updated_at: string | null;
}

export interface CreateGoalFromInstallmentVsCashDto {
  readonly title: string;
  readonly selected_option: SelectedPaymentOption;
  readonly description?: string;
  readonly category?: string;
  readonly target_date?: string;
  readonly priority?: number;
  readonly current_amount?: string;
}

export interface CreateGoalFromInstallmentVsCashResponseDto {
  readonly goal: InstallmentVsCashGoalDto;
  readonly simulation: InstallmentVsCashSavedSimulationDto;
}

export interface CreatePlannedExpenseFromInstallmentVsCashDto {
  readonly title: string;
  readonly selected_option: SelectedPaymentOption;
  readonly description?: string;
  readonly observation?: string;
  readonly due_date?: string;
  readonly first_due_date?: string;
  readonly upfront_due_date?: string;
  readonly tag_id?: string;
  readonly account_id?: string;
  readonly credit_card_id?: string;
  readonly currency?: "BRL";
  readonly status?: "pending" | "paid" | "cancelled" | "postponed" | "overdue";
}

export interface InstallmentVsCashPlannedTransactionDto {
  readonly id: string;
  readonly title: string;
  readonly amount: string;
  readonly type: string;
  readonly due_date: string;
  readonly start_date: string | null;
  readonly end_date: string | null;
  readonly description: string | null;
  readonly observation: string | null;
  readonly is_recurring: boolean;
  readonly is_installment: boolean;
  readonly installment_count: number | null;
  readonly tag_id: string | null;
  readonly account_id: string | null;
  readonly credit_card_id: string | null;
  readonly status: string;
  readonly currency: string;
  readonly created_at: string | null;
  readonly updated_at: string | null;
}

export interface CreatePlannedExpenseFromInstallmentVsCashResponseDto {
  readonly transactions: readonly InstallmentVsCashPlannedTransactionDto[];
  readonly simulation: InstallmentVsCashSavedSimulationDto;
}

export interface InstallmentVsCashHistoryResponseDto {
  readonly items: readonly InstallmentVsCashSavedSimulationDto[];
  readonly pagination?: {
    readonly page: number;
    readonly per_page: number;
    readonly total: number;
    readonly pages: number;
  };
}

export interface InstallmentVsCashNormalizedInput {
  readonly cashPrice: number;
  readonly installmentCount: number;
  readonly installmentAmount: number;
  readonly installmentTotal: number;
  readonly firstPaymentDelayDays: number;
  readonly opportunityRateType: OpportunityRateType;
  readonly opportunityRateAnnual: number;
  readonly inflationRateAnnual: number;
  readonly feesUpfront: number;
  readonly scenarioLabel: string | null;
}

export interface InstallmentVsCashIndicatorSnapshot {
  readonly presetType: string;
  readonly source: string;
  readonly annualRatePercent: number;
  readonly asOf: string;
}

export interface InstallmentVsCashComparison {
  readonly cashOptionTotal: number;
  readonly installmentOptionTotal: number;
  readonly installmentPresentValue: number;
  readonly installmentRealValueToday: number;
  readonly presentValueDeltaVsCash: number;
  readonly absoluteDeltaVsCash: number;
  readonly relativeDeltaVsCashPercent: number;
  readonly breakEvenDiscountPercent: number;
  readonly breakEvenOpportunityRateAnnual: number;
}

export interface InstallmentVsCashCashOption {
  readonly total: number;
}

export interface InstallmentVsCashInstallmentOption {
  readonly count: number;
  readonly amounts: readonly number[];
  readonly installmentAmount: number;
  readonly nominalTotal: number;
  readonly upfrontFees: number;
  readonly firstPaymentDelayDays: number;
}

export interface InstallmentVsCashOptions {
  readonly cash: InstallmentVsCashCashOption;
  readonly installment: InstallmentVsCashInstallmentOption;
}

export interface InstallmentVsCashNeutralityBand {
  readonly absoluteBrl: number;
  readonly relativePercent: number;
}

export interface InstallmentVsCashAssumptions {
  readonly opportunityRateType: OpportunityRateType;
  readonly opportunityRateAnnualPercent: number;
  readonly inflationRateAnnualPercent: number;
  readonly periodicity: string;
  readonly firstPaymentDelayDays: number;
  readonly upfrontFeesApplyTo: string;
  readonly neutralityRule: string;
}

export interface InstallmentVsCashScheduleItem {
  readonly installmentNumber: number;
  readonly dueInDays: number;
  readonly amount: number;
  readonly presentValue: number;
  readonly realValueToday: number;
  readonly cumulativeNominal: number;
  readonly cumulativePresentValue: number;
  readonly cumulativeRealValueToday: number;
  readonly cashCumulative: number;
}

export interface InstallmentVsCashResult {
  readonly recommendedOption: RecommendedOption;
  readonly recommendationReason: string;
  readonly formulaExplainer: string;
  readonly comparison: InstallmentVsCashComparison;
  readonly options: InstallmentVsCashOptions;
  readonly neutralityBand: InstallmentVsCashNeutralityBand;
  readonly assumptions: InstallmentVsCashAssumptions;
  readonly indicatorSnapshot: InstallmentVsCashIndicatorSnapshot | null;
  readonly schedule: readonly InstallmentVsCashScheduleItem[];
}

export interface InstallmentVsCashCalculation {
  readonly toolId: string;
  readonly ruleVersion: string;
  readonly input: InstallmentVsCashNormalizedInput;
  readonly result: InstallmentVsCashResult;
}

export interface InstallmentVsCashSavedSimulation {
  readonly id: string;
  readonly userId: string | null;
  readonly toolId: string;
  readonly ruleVersion: string;
  readonly inputs: InstallmentVsCashNormalizedInput;
  readonly result: InstallmentVsCashResult;
  readonly saved: boolean;
  readonly goalId: string | null;
  readonly createdAt: string;
}

export interface InstallmentVsCashSavedCalculation {
  readonly simulation: InstallmentVsCashSavedSimulation;
  readonly calculation: InstallmentVsCashCalculation;
}

export interface InstallmentVsCashGoal {
  readonly id: string;
  readonly title: string;
  readonly description: string | null;
  readonly category: string | null;
  readonly targetAmount: number;
  readonly currentAmount: number;
  readonly priority: number;
  readonly targetDate: string | null;
  readonly status: string;
  readonly createdAt: string | null;
  readonly updatedAt: string | null;
}

export interface InstallmentVsCashGoalBridgeResponse {
  readonly goal: InstallmentVsCashGoal;
  readonly simulation: InstallmentVsCashSavedSimulation;
}

export interface InstallmentVsCashPlannedTransaction {
  readonly id: string;
  readonly title: string;
  readonly amount: number;
  readonly type: string;
  readonly dueDate: string;
  readonly startDate: string | null;
  readonly endDate: string | null;
  readonly description: string | null;
  readonly observation: string | null;
  readonly isRecurring: boolean;
  readonly isInstallment: boolean;
  readonly installmentCount: number | null;
  readonly tagId: string | null;
  readonly accountId: string | null;
  readonly creditCardId: string | null;
  readonly status: string;
  readonly currency: string;
  readonly createdAt: string | null;
  readonly updatedAt: string | null;
}

export interface InstallmentVsCashPlannedExpenseBridgeResponse {
  readonly transactions: readonly InstallmentVsCashPlannedTransaction[];
  readonly simulation: InstallmentVsCashSavedSimulation;
}

export interface CreateInstallmentVsCashGoalPayload {
  readonly title: string;
  readonly selectedOption: SelectedPaymentOption;
  readonly description?: string;
  readonly category?: string;
  readonly targetDate?: string;
  readonly priority?: number;
  readonly currentAmount?: number;
}

export interface CreateInstallmentVsCashPlannedExpensePayload {
  readonly title: string;
  readonly selectedOption: SelectedPaymentOption;
  readonly description?: string;
  readonly observation?: string;
  readonly dueDate?: string;
  readonly firstDueDate?: string;
  readonly upfrontDueDate?: string;
  readonly tagId?: string;
  readonly accountId?: string;
  readonly creditCardId?: string;
  readonly currency?: "BRL";
  readonly status?: "pending" | "paid" | "cancelled" | "postponed" | "overdue";
}
