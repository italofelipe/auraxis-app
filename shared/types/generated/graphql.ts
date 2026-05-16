/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  /**
   * The `DateTime` scalar type represents a DateTime
   * value as specified by
   * [iso8601](https://en.wikipedia.org/wiki/ISO_8601).
   */
  DateTime: { input: string; output: string; }
  /**
   * Arbitrary-precision decimal serialised as a string.
   *
   * Output: always a string in fixed-point notation (no scientific exponent).
   * Input: accepts string, int, float, or Decimal — coerced via ``Decimal(str(x))``.
   * Null is preserved.
   */
  DecimalScalar: { input: string; output: string; }
  /**
   * Allows use of a JSON String for input / output from the GraphQL schema.
   *
   * Use of this type is *not recommended* as you lose the benefits of having a defined, static
   * schema (one of the key benefits of GraphQL).
   */
  JSONString: { input: string; output: string; }
  /**
   * Leverages the internal Python implementation of UUID (uuid.UUID) to provide native UUID objects
   * in fields, resolvers and input.
   */
  UUID: { input: string; output: string; }
};

export type AiInsightHistoryResultType = {
  __typename?: 'AIInsightHistoryResultType';
  items: Array<AiInsightType>;
  page: Scalars['Int']['output'];
  perPage: Scalars['Int']['output'];
  total: Scalars['Int']['output'];
};

export type AiInsightType = {
  __typename?: 'AIInsightType';
  content: Scalars['String']['output'];
  costUsd: Scalars['Float']['output'];
  createdAt: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  insightType: Scalars['String']['output'];
  model: Scalars['String']['output'];
  periodEnd: Scalars['String']['output'];
  periodLabel: Scalars['String']['output'];
  periodStart: Scalars['String']['output'];
  tokensUsed: Scalars['Int']['output'];
};

export type AccountListType = {
  __typename?: 'AccountListType';
  accounts: Array<AccountType>;
  total: Scalars['Int']['output'];
};

export type AccountPayload = {
  __typename?: 'AccountPayload';
  data?: Maybe<AccountType>;
  /** Field-level validation errors (empty on success). */
  errors: Array<ValidationError>;
  /** Human-readable status message. */
  message: Scalars['String']['output'];
  /** True when the mutation completed without errors. */
  ok: Scalars['Boolean']['output'];
};

export type AccountType = {
  __typename?: 'AccountType';
  accountType: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  initialBalance?: Maybe<Scalars['DecimalScalar']['output']>;
  institution?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
};

export type AddInvestmentOperationMutation = {
  __typename?: 'AddInvestmentOperationMutation';
  item: InvestmentOperationType;
  message: Scalars['String']['output'];
};

/** Canonical payload for addTicker mutation. */
export type AddTickerPayload = {
  __typename?: 'AddTickerPayload';
  /** The newly added ticker. */
  data?: Maybe<TickerType>;
  /** Field-level validation errors (empty on success). */
  errors: Array<ValidationError>;
  /** Human-readable status message. */
  message: Scalars['String']['output'];
  /** True when the mutation completed without errors. */
  ok: Scalars['Boolean']['output'];
};

export type AddWalletEntryMutation = {
  __typename?: 'AddWalletEntryMutation';
  item: WalletType;
};

export type AlertPreferenceType = {
  __typename?: 'AlertPreferenceType';
  category: Scalars['String']['output'];
  enabled: Scalars['Boolean']['output'];
  globalOptOut: Scalars['Boolean']['output'];
};

export type AuthPayloadType = {
  __typename?: 'AuthPayloadType';
  message: Scalars['String']['output'];
  token?: Maybe<Scalars['String']['output']>;
  user?: Maybe<UserType>;
};

export type BankImportConfirmationPayload = {
  __typename?: 'BankImportConfirmationPayload';
  bankName?: Maybe<Scalars['String']['output']>;
  /** Field-level validation errors (empty on success). */
  errors: Array<ValidationError>;
  importedCount?: Maybe<Scalars['Int']['output']>;
  /** Human-readable status message. */
  message: Scalars['String']['output'];
  month?: Maybe<Scalars['String']['output']>;
  /** True when the mutation completed without errors. */
  ok: Scalars['Boolean']['output'];
  replacedCount?: Maybe<Scalars['Int']['output']>;
  skippedDuplicates?: Maybe<Scalars['Int']['output']>;
  transactions?: Maybe<Array<ImportedTransactionType>>;
};

export type BankImportPreviewEntryType = {
  __typename?: 'BankImportPreviewEntryType';
  amount: Scalars['String']['output'];
  bankName: Scalars['String']['output'];
  date: Scalars['String']['output'];
  description: Scalars['String']['output'];
  duplicateReason?: Maybe<Scalars['String']['output']>;
  externalId: Scalars['String']['output'];
  isDuplicate: Scalars['Boolean']['output'];
  transactionType: Scalars['String']['output'];
};

export type BankImportPreviewPayload = {
  __typename?: 'BankImportPreviewPayload';
  data?: Maybe<BankImportPreviewType>;
  /** Field-level validation errors (empty on success). */
  errors: Array<ValidationError>;
  /** Human-readable status message. */
  message: Scalars['String']['output'];
  /** True when the mutation completed without errors. */
  ok: Scalars['Boolean']['output'];
};

export type BankImportPreviewType = {
  __typename?: 'BankImportPreviewType';
  bankName: Scalars['String']['output'];
  duplicateEntries: Scalars['Int']['output'];
  entries: Array<BankImportPreviewEntryType>;
  newEntries: Scalars['Int']['output'];
  totalEntries: Scalars['Int']['output'];
};

/** An enumeration. */
export type BillingCycle =
  | 'ANNUAL'
  | 'MONTHLY'
  | 'SEMIANNUAL';

export type BillingPlanListPayloadType = {
  __typename?: 'BillingPlanListPayloadType';
  plans: Array<Maybe<BillingPlanType>>;
};

export type BillingPlanType = {
  __typename?: 'BillingPlanType';
  billingCycle: Scalars['String']['output'];
  currency: Scalars['String']['output'];
  description: Scalars['String']['output'];
  displayName: Scalars['String']['output'];
  features: Array<Maybe<Scalars['String']['output']>>;
  isActive: Scalars['Boolean']['output'];
  planCode: Scalars['String']['output'];
  priceCents: Scalars['Int']['output'];
  slug: Scalars['String']['output'];
};

export type BudgetListPayloadType = {
  __typename?: 'BudgetListPayloadType';
  items: Array<Maybe<BudgetType>>;
};

export type BudgetSummaryType = {
  __typename?: 'BudgetSummaryType';
  budgetCount: Scalars['Int']['output'];
  percentageUsed: Scalars['Float']['output'];
  totalBudgeted: Scalars['String']['output'];
  totalRemaining: Scalars['String']['output'];
  totalSpent: Scalars['String']['output'];
};

export type BudgetType = {
  __typename?: 'BudgetType';
  amount: Scalars['String']['output'];
  createdAt?: Maybe<Scalars['String']['output']>;
  endDate?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  isOverBudget: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  percentageUsed: Scalars['Float']['output'];
  period: Scalars['String']['output'];
  remaining: Scalars['String']['output'];
  spent: Scalars['String']['output'];
  startDate?: Maybe<Scalars['String']['output']>;
  tagColor?: Maybe<Scalars['String']['output']>;
  tagId?: Maybe<Scalars['String']['output']>;
  tagName?: Maybe<Scalars['String']['output']>;
  updatedAt?: Maybe<Scalars['String']['output']>;
};

export type CancelSubscriptionMutation = {
  __typename?: 'CancelSubscriptionMutation';
  message: Scalars['String']['output'];
  ok: Scalars['Boolean']['output'];
  subscription: SubscriptionType;
};

export type CheckoutSessionType = {
  __typename?: 'CheckoutSessionType';
  checkoutUrl: Scalars['String']['output'];
  provider: Scalars['String']['output'];
  providerCustomerId?: Maybe<Scalars['String']['output']>;
  providerSubscriptionId?: Maybe<Scalars['String']['output']>;
};

export type CreateBudgetMutation = {
  __typename?: 'CreateBudgetMutation';
  budget: BudgetType;
  message: Scalars['String']['output'];
};

export type CreateCheckoutSessionMutation = {
  __typename?: 'CreateCheckoutSessionMutation';
  checkout: CheckoutSessionType;
  message: Scalars['String']['output'];
};

export type CreateGoalFromInstallmentVsCashSimulationMutation = {
  __typename?: 'CreateGoalFromInstallmentVsCashSimulationMutation';
  goal: GoalTypeObject;
  message: Scalars['String']['output'];
  simulation: InstallmentVsCashSimulationType;
};

export type CreateGoalMutation = {
  __typename?: 'CreateGoalMutation';
  goal: GoalTypeObject;
  message: Scalars['String']['output'];
};

export type CreatePlannedExpenseFromInstallmentVsCashSimulationMutation = {
  __typename?: 'CreatePlannedExpenseFromInstallmentVsCashSimulationMutation';
  message: Scalars['String']['output'];
  simulation: InstallmentVsCashSimulationType;
  transactions: Array<Maybe<TransactionTypeObject>>;
};

export type CreateTransactionMutation = {
  __typename?: 'CreateTransactionMutation';
  items: Array<Maybe<TransactionTypeObject>>;
  message: Scalars['String']['output'];
};

export type DashboardCategoriesType = {
  __typename?: 'DashboardCategoriesType';
  expense: Array<Maybe<DashboardCategoryType>>;
  income: Array<Maybe<DashboardCategoryType>>;
};

export type DashboardCategoryType = {
  __typename?: 'DashboardCategoryType';
  categoryName: Scalars['String']['output'];
  tagId?: Maybe<Scalars['String']['output']>;
  totalAmount: Scalars['DecimalScalar']['output'];
  transactionsCount: Scalars['Int']['output'];
};

export type DashboardCountsType = {
  __typename?: 'DashboardCountsType';
  expenseTransactions: Scalars['Int']['output'];
  incomeTransactions: Scalars['Int']['output'];
  status: DashboardStatusCountsType;
  totalTransactions: Scalars['Int']['output'];
};

export type DashboardStatusCountsType = {
  __typename?: 'DashboardStatusCountsType';
  cancelled: Scalars['Int']['output'];
  overdue: Scalars['Int']['output'];
  paid: Scalars['Int']['output'];
  pending: Scalars['Int']['output'];
  postponed: Scalars['Int']['output'];
};

export type DashboardTotalsType = {
  __typename?: 'DashboardTotalsType';
  balance: Scalars['DecimalScalar']['output'];
  expenseTotal: Scalars['DecimalScalar']['output'];
  incomeTotal: Scalars['DecimalScalar']['output'];
};

export type DeleteBudgetMutation = {
  __typename?: 'DeleteBudgetMutation';
  message: Scalars['String']['output'];
  ok: Scalars['Boolean']['output'];
};

export type DeleteGoalMutation = {
  __typename?: 'DeleteGoalMutation';
  message: Scalars['String']['output'];
  ok: Scalars['Boolean']['output'];
};

export type DeleteInvestmentOperationMutation = {
  __typename?: 'DeleteInvestmentOperationMutation';
  message: Scalars['String']['output'];
  ok: Scalars['Boolean']['output'];
};

/** Canonical payload for deleteTicker mutation. */
export type DeleteTickerPayload = {
  __typename?: 'DeleteTickerPayload';
  /** Field-level validation errors (empty on success). */
  errors: Array<ValidationError>;
  /** Human-readable status message. */
  message: Scalars['String']['output'];
  /** True when the mutation completed without errors. */
  ok: Scalars['Boolean']['output'];
};

export type DeleteTransactionMutation = {
  __typename?: 'DeleteTransactionMutation';
  message: Scalars['String']['output'];
  ok: Scalars['Boolean']['output'];
};

export type DeleteWalletEntryMutation = {
  __typename?: 'DeleteWalletEntryMutation';
  message: Scalars['String']['output'];
  ok: Scalars['Boolean']['output'];
};

export type FiscalDocumentListType = {
  __typename?: 'FiscalDocumentListType';
  fiscalDocuments: Array<FiscalDocumentType>;
  total: Scalars['Int']['output'];
};

export type FiscalDocumentPayload = {
  __typename?: 'FiscalDocumentPayload';
  data?: Maybe<FiscalDocumentType>;
  /** Field-level validation errors (empty on success). */
  errors: Array<ValidationError>;
  /** Human-readable status message. */
  message: Scalars['String']['output'];
  /** True when the mutation completed without errors. */
  ok: Scalars['Boolean']['output'];
};

export type FiscalDocumentType = {
  __typename?: 'FiscalDocumentType';
  counterparty: Scalars['String']['output'];
  createdAt: Scalars['String']['output'];
  currency: Scalars['String']['output'];
  description?: Maybe<Scalars['String']['output']>;
  externalId: Scalars['String']['output'];
  grossAmount: Scalars['DecimalScalar']['output'];
  id: Scalars['ID']['output'];
  issuedAt: Scalars['String']['output'];
  status: Scalars['String']['output'];
  type: Scalars['String']['output'];
};

export type GoalListPayloadType = {
  __typename?: 'GoalListPayloadType';
  items: Array<Maybe<GoalTypeObject>>;
  pagination: PaginationType;
};

export type GoalPlanType = {
  __typename?: 'GoalPlanType';
  capacityAmount: Scalars['String']['output'];
  estimatedCompletionDate?: Maybe<Scalars['String']['output']>;
  goalHealth: Scalars['String']['output'];
  horizon: Scalars['String']['output'];
  monthsToGoal?: Maybe<Scalars['Int']['output']>;
  monthsUntilTargetDate?: Maybe<Scalars['Int']['output']>;
  projectedMonthlyContribution: Scalars['String']['output'];
  recommendations: Array<Maybe<GoalRecommendationType>>;
  recommendedMonthlyContribution: Scalars['String']['output'];
  remainingAmount: Scalars['String']['output'];
  targetDate?: Maybe<Scalars['String']['output']>;
};

export type GoalRecommendationType = {
  __typename?: 'GoalRecommendationType';
  action: Scalars['String']['output'];
  estimatedDate?: Maybe<Scalars['String']['output']>;
  priority: Scalars['String']['output'];
  title: Scalars['String']['output'];
};

/** An enumeration. */
export type GoalStatus =
  | 'ACTIVE'
  | 'CANCELLED'
  | 'COMPLETED'
  | 'PAUSED';

export type GoalTypeObject = {
  __typename?: 'GoalTypeObject';
  category?: Maybe<Scalars['String']['output']>;
  createdAt?: Maybe<Scalars['String']['output']>;
  currentAmount: Scalars['String']['output'];
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  priority: Scalars['Int']['output'];
  status: Scalars['String']['output'];
  targetAmount: Scalars['String']['output'];
  targetDate?: Maybe<Scalars['String']['output']>;
  title: Scalars['String']['output'];
  updatedAt?: Maybe<Scalars['String']['output']>;
};

export type ImportedTransactionType = {
  __typename?: 'ImportedTransactionType';
  amount: Scalars['String']['output'];
  bankName?: Maybe<Scalars['String']['output']>;
  dueDate: Scalars['String']['output'];
  externalId?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  title: Scalars['String']['output'];
  type: Scalars['String']['output'];
};

export type InstallmentVsCashAssumptionsType = {
  __typename?: 'InstallmentVsCashAssumptionsType';
  firstPaymentDelayDays: Scalars['Int']['output'];
  inflationRateAnnualPercent: Scalars['String']['output'];
  neutralityRule: Scalars['String']['output'];
  opportunityRateAnnualPercent: Scalars['String']['output'];
  opportunityRateType: Scalars['String']['output'];
  periodicity: Scalars['String']['output'];
  upfrontFeesApplyTo: Scalars['String']['output'];
};

export type InstallmentVsCashCalculationPayloadType = {
  __typename?: 'InstallmentVsCashCalculationPayloadType';
  input: InstallmentVsCashInputType;
  result: InstallmentVsCashResultType;
  ruleVersion: Scalars['String']['output'];
  toolId: Scalars['String']['output'];
};

export type InstallmentVsCashCashOptionType = {
  __typename?: 'InstallmentVsCashCashOptionType';
  total: Scalars['String']['output'];
};

export type InstallmentVsCashComparisonType = {
  __typename?: 'InstallmentVsCashComparisonType';
  absoluteDeltaVsCash: Scalars['String']['output'];
  breakEvenDiscountPercent: Scalars['String']['output'];
  breakEvenOpportunityRateAnnual: Scalars['String']['output'];
  cashOptionTotal: Scalars['String']['output'];
  installmentOptionTotal: Scalars['String']['output'];
  installmentPresentValue: Scalars['String']['output'];
  installmentRealValueToday: Scalars['String']['output'];
  presentValueDeltaVsCash: Scalars['String']['output'];
  relativeDeltaVsCashPercent: Scalars['String']['output'];
};

export type InstallmentVsCashIndicatorSnapshotType = {
  __typename?: 'InstallmentVsCashIndicatorSnapshotType';
  annualRatePercent: Scalars['String']['output'];
  asOf: Scalars['String']['output'];
  presetType: Scalars['String']['output'];
  source: Scalars['String']['output'];
};

export type InstallmentVsCashInputType = {
  __typename?: 'InstallmentVsCashInputType';
  cashPrice: Scalars['String']['output'];
  feesUpfront: Scalars['String']['output'];
  firstPaymentDelayDays: Scalars['Int']['output'];
  inflationRateAnnual: Scalars['String']['output'];
  installmentAmount: Scalars['String']['output'];
  installmentCount: Scalars['Int']['output'];
  installmentTotal: Scalars['String']['output'];
  opportunityRateAnnual: Scalars['String']['output'];
  opportunityRateType: Scalars['String']['output'];
  scenarioLabel?: Maybe<Scalars['String']['output']>;
};

export type InstallmentVsCashInstallmentOptionType = {
  __typename?: 'InstallmentVsCashInstallmentOptionType';
  amounts: Array<Maybe<Scalars['String']['output']>>;
  count: Scalars['Int']['output'];
  firstPaymentDelayDays: Scalars['Int']['output'];
  installmentAmount: Scalars['String']['output'];
  nominalTotal: Scalars['String']['output'];
  upfrontFees: Scalars['String']['output'];
};

export type InstallmentVsCashNeutralityBandType = {
  __typename?: 'InstallmentVsCashNeutralityBandType';
  absoluteBrl: Scalars['String']['output'];
  relativePercent: Scalars['String']['output'];
};

export type InstallmentVsCashOptionsType = {
  __typename?: 'InstallmentVsCashOptionsType';
  cash: InstallmentVsCashCashOptionType;
  installment: InstallmentVsCashInstallmentOptionType;
};

export type InstallmentVsCashResultType = {
  __typename?: 'InstallmentVsCashResultType';
  assumptions: InstallmentVsCashAssumptionsType;
  comparison: InstallmentVsCashComparisonType;
  formulaExplainer: Scalars['String']['output'];
  indicatorSnapshot?: Maybe<InstallmentVsCashIndicatorSnapshotType>;
  neutralityBand: InstallmentVsCashNeutralityBandType;
  options: InstallmentVsCashOptionsType;
  recommendationReason: Scalars['String']['output'];
  recommendedOption: Scalars['String']['output'];
  schedule: Array<Maybe<InstallmentVsCashScheduleItemType>>;
};

export type InstallmentVsCashScheduleItemType = {
  __typename?: 'InstallmentVsCashScheduleItemType';
  amount: Scalars['String']['output'];
  cashCumulative: Scalars['String']['output'];
  cumulativeNominal: Scalars['String']['output'];
  cumulativePresentValue: Scalars['String']['output'];
  cumulativeRealValueToday: Scalars['String']['output'];
  dueInDays: Scalars['Int']['output'];
  installmentNumber: Scalars['Int']['output'];
  presentValue: Scalars['String']['output'];
  realValueToday: Scalars['String']['output'];
};

export type InstallmentVsCashSimulationType = {
  __typename?: 'InstallmentVsCashSimulationType';
  createdAt: Scalars['String']['output'];
  goalId?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  input: InstallmentVsCashInputType;
  result: InstallmentVsCashResultType;
  ruleVersion: Scalars['String']['output'];
  saved: Scalars['Boolean']['output'];
  toolId: Scalars['String']['output'];
  userId?: Maybe<Scalars['String']['output']>;
};

export type InvestmentInvestedAmountType = {
  __typename?: 'InvestmentInvestedAmountType';
  buyAmount: Scalars['String']['output'];
  buyOperations: Scalars['Int']['output'];
  date: Scalars['String']['output'];
  netInvestedAmount: Scalars['String']['output'];
  sellAmount: Scalars['String']['output'];
  sellOperations: Scalars['Int']['output'];
  totalOperations: Scalars['Int']['output'];
};

export type InvestmentOperationListPayloadType = {
  __typename?: 'InvestmentOperationListPayloadType';
  items: Array<Maybe<InvestmentOperationType>>;
  pagination: PaginationType;
};

export type InvestmentOperationSummaryType = {
  __typename?: 'InvestmentOperationSummaryType';
  averageBuyPrice: Scalars['String']['output'];
  buyOperations: Scalars['Int']['output'];
  buyQuantity: Scalars['String']['output'];
  grossBuyAmount: Scalars['String']['output'];
  grossSellAmount: Scalars['String']['output'];
  netQuantity: Scalars['String']['output'];
  sellOperations: Scalars['Int']['output'];
  sellQuantity: Scalars['String']['output'];
  totalFees: Scalars['String']['output'];
  totalOperations: Scalars['Int']['output'];
};

export type InvestmentOperationType = {
  __typename?: 'InvestmentOperationType';
  createdAt?: Maybe<Scalars['String']['output']>;
  executedAt: Scalars['String']['output'];
  fees: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  notes?: Maybe<Scalars['String']['output']>;
  operationType: Scalars['String']['output'];
  quantity: Scalars['String']['output'];
  unitPrice: Scalars['String']['output'];
  updatedAt?: Maybe<Scalars['String']['output']>;
  userId: Scalars['ID']['output'];
  walletId: Scalars['ID']['output'];
};

export type InvestmentPositionType = {
  __typename?: 'InvestmentPositionType';
  averageCost: Scalars['String']['output'];
  buyOperations: Scalars['Int']['output'];
  currentCostBasis: Scalars['String']['output'];
  currentQuantity: Scalars['String']['output'];
  sellOperations: Scalars['Int']['output'];
  totalBuyQuantity: Scalars['String']['output'];
  totalOperations: Scalars['Int']['output'];
  totalSellQuantity: Scalars['String']['output'];
};

export type LogoutMutation = {
  __typename?: 'LogoutMutation';
  message: Scalars['String']['output'];
  ok: Scalars['Boolean']['output'];
};

export type Mutation = {
  __typename?: 'Mutation';
  /** @deprecated ADR-0002: use POST /wallet/{id}/operations */
  addInvestmentOperation?: Maybe<AddInvestmentOperationMutation>;
  addTicker?: Maybe<AddTickerPayload>;
  /** @deprecated ADR-0002: use POST /wallet */
  addWalletEntry?: Maybe<AddWalletEntryMutation>;
  /** @deprecated ADR-0002: use DELETE /fiscal/receivables/{id} */
  cancelReceivable?: Maybe<ReceivablePayload>;
  /** @deprecated ADR-0004: use POST /subscription/cancel */
  cancelSubscription?: Maybe<CancelSubscriptionMutation>;
  /**
   * Persist a subset of bank statement entries as transactions.
   *
   * ``mode`` controls how existing data is handled:
   *
   * - ``selective``: skip duplicates, import only new entries.
   * - ``replace_month``: delete all existing bank-imported transactions for
   *   the given month/bank before importing the selected set.
   */
  confirmBankImport?: Maybe<BankImportConfirmationPayload>;
  confirmEmail?: Maybe<AuthPayloadType>;
  createAccount?: Maybe<AccountPayload>;
  /** @deprecated ADR-0002: use POST /budgets */
  createBudget?: Maybe<CreateBudgetMutation>;
  /** @deprecated ADR-0004: use POST /subscription/checkout */
  createCheckoutSession?: Maybe<CreateCheckoutSessionMutation>;
  /** @deprecated ADR-0002: use POST /fiscal/fiscal-documents */
  createFiscalDocument?: Maybe<FiscalDocumentPayload>;
  /** @deprecated ADR-0002: use POST /goals */
  createGoal?: Maybe<CreateGoalMutation>;
  createGoalFromInstallmentVsCashSimulation?: Maybe<CreateGoalFromInstallmentVsCashSimulationMutation>;
  createPlannedExpenseFromInstallmentVsCashSimulation?: Maybe<CreatePlannedExpenseFromInstallmentVsCashSimulationMutation>;
  /** @deprecated ADR-0002: use POST /fiscal/receivables */
  createReceivable?: Maybe<ReceivablePayload>;
  createTag?: Maybe<TagPayload>;
  /** @deprecated ADR-0002: use POST /transactions */
  createTransaction?: Maybe<CreateTransactionMutation>;
  deleteAccount?: Maybe<AccountPayload>;
  /** @deprecated ADR-0002: use DELETE /budgets/{id} */
  deleteBudget?: Maybe<DeleteBudgetMutation>;
  /** @deprecated ADR-0002: use DELETE /goals/{id} */
  deleteGoal?: Maybe<DeleteGoalMutation>;
  /** @deprecated ADR-0002: use DELETE /wallet/{id}/operations/{op_id} */
  deleteInvestmentOperation?: Maybe<DeleteInvestmentOperationMutation>;
  deleteTag?: Maybe<TagPayload>;
  deleteTicker?: Maybe<DeleteTickerPayload>;
  /** @deprecated ADR-0002: use DELETE /transactions/{id} */
  deleteTransaction?: Maybe<DeleteTransactionMutation>;
  /** @deprecated ADR-0002: use DELETE /wallet/{id} */
  deleteWalletEntry?: Maybe<DeleteWalletEntryMutation>;
  forgotPassword?: Maybe<AuthPayloadType>;
  login?: Maybe<AuthPayloadType>;
  logout?: Maybe<LogoutMutation>;
  /** @deprecated ADR-0002: use PATCH /fiscal/receivables/{id}/receive */
  markReceivableReceived?: Maybe<ReceivablePayload>;
  /**
   * Parse a bank statement text and return a deduplication preview.
   *
   * The client submits the raw text content (CSV for Nubank, OFX for others)
   * together with a bank identifier.  No data is written to the database.
   */
  previewBankStatement?: Maybe<BankImportPreviewPayload>;
  registerUser?: Maybe<AuthPayloadType>;
  resendConfirmationEmail?: Maybe<AuthPayloadType>;
  resetPassword?: Maybe<AuthPayloadType>;
  /** Revoke all active sessions — global logout (#1028). */
  revokeAllSessions?: Maybe<RevokeAllSessionsMutation>;
  /** Revoke a specific session by ID (multi-device, #1028). */
  revokeSession?: Maybe<RevokeSessionMutation>;
  saveInstallmentVsCashSimulation?: Maybe<SaveInstallmentVsCashSimulationMutation>;
  simulateGoalPlan?: Maybe<SimulateGoalPlanMutation>;
  updateAccount?: Maybe<AccountPayload>;
  /** @deprecated ADR-0002: use PATCH /budgets/{id} */
  updateBudget?: Maybe<UpdateBudgetMutation>;
  /** @deprecated ADR-0002: use PATCH /goals/{id} */
  updateGoal?: Maybe<UpdateGoalMutation>;
  /** @deprecated ADR-0002: use PATCH /wallet/{id}/operations/{op_id} */
  updateInvestmentOperation?: Maybe<UpdateInvestmentOperationMutation>;
  updateNotificationPreferences?: Maybe<UpdateNotificationPreferencesPayload>;
  updateTag?: Maybe<TagPayload>;
  /** @deprecated ADR-0002: use PATCH /transactions/{id} */
  updateTransaction?: Maybe<UpdateTransactionMutation>;
  updateUserProfile?: Maybe<UpdateUserProfileMutation>;
  /** @deprecated ADR-0002: use PATCH /wallet/{id} */
  updateWalletEntry?: Maybe<UpdateWalletEntryMutation>;
};


export type MutationAddInvestmentOperationArgs = {
  executedAt?: InputMaybe<Scalars['String']['input']>;
  fees?: InputMaybe<Scalars['String']['input']>;
  investmentId: Scalars['UUID']['input'];
  notes?: InputMaybe<Scalars['String']['input']>;
  operationType: Scalars['String']['input'];
  quantity: Scalars['String']['input'];
  unitPrice: Scalars['String']['input'];
};


export type MutationAddTickerArgs = {
  quantity: Scalars['Float']['input'];
  symbol: Scalars['String']['input'];
  type?: InputMaybe<Scalars['String']['input']>;
};


export type MutationAddWalletEntryArgs = {
  annualRate?: InputMaybe<Scalars['DecimalScalar']['input']>;
  assetClass?: InputMaybe<WalletAssetClass>;
  name: Scalars['String']['input'];
  quantity?: InputMaybe<Scalars['Int']['input']>;
  registerDate?: InputMaybe<Scalars['String']['input']>;
  shouldBeOnWallet: Scalars['Boolean']['input'];
  targetWithdrawDate?: InputMaybe<Scalars['String']['input']>;
  ticker?: InputMaybe<Scalars['String']['input']>;
  value?: InputMaybe<Scalars['DecimalScalar']['input']>;
};


export type MutationCancelReceivableArgs = {
  entryId: Scalars['UUID']['input'];
};


export type MutationConfirmBankImportArgs = {
  bankName: Scalars['String']['input'];
  mode: Scalars['String']['input'];
  month: Scalars['String']['input'];
  selectedEntries: Array<SelectedEntryInput>;
};


export type MutationConfirmEmailArgs = {
  token: Scalars['String']['input'];
};


export type MutationCreateAccountArgs = {
  accountType?: InputMaybe<Scalars['String']['input']>;
  initialBalance?: InputMaybe<Scalars['String']['input']>;
  institution?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
};


export type MutationCreateBudgetArgs = {
  amount: Scalars['String']['input'];
  endDate?: InputMaybe<Scalars['String']['input']>;
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  name: Scalars['String']['input'];
  period: Scalars['String']['input'];
  startDate?: InputMaybe<Scalars['String']['input']>;
  tagId?: InputMaybe<Scalars['String']['input']>;
};


export type MutationCreateCheckoutSessionArgs = {
  billingCycle?: InputMaybe<BillingCycle>;
  planSlug: Scalars['String']['input'];
};


export type MutationCreateFiscalDocumentArgs = {
  amount: Scalars['String']['input'];
  counterpartName?: InputMaybe<Scalars['String']['input']>;
  externalId?: InputMaybe<Scalars['String']['input']>;
  issuedAt: Scalars['String']['input'];
  type: Scalars['String']['input'];
};


export type MutationCreateGoalArgs = {
  category?: InputMaybe<Scalars['String']['input']>;
  currentAmount?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  priority?: InputMaybe<Scalars['Int']['input']>;
  status?: InputMaybe<GoalStatus>;
  targetAmount: Scalars['String']['input'];
  targetDate?: InputMaybe<Scalars['String']['input']>;
  title: Scalars['String']['input'];
};


export type MutationCreateGoalFromInstallmentVsCashSimulationArgs = {
  category?: InputMaybe<Scalars['String']['input']>;
  currentAmount?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  priority?: InputMaybe<Scalars['Int']['input']>;
  selectedOption: Scalars['String']['input'];
  simulationId: Scalars['UUID']['input'];
  targetDate?: InputMaybe<Scalars['String']['input']>;
  title: Scalars['String']['input'];
};


export type MutationCreatePlannedExpenseFromInstallmentVsCashSimulationArgs = {
  accountId?: InputMaybe<Scalars['UUID']['input']>;
  creditCardId?: InputMaybe<Scalars['UUID']['input']>;
  currency?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  dueDate?: InputMaybe<Scalars['String']['input']>;
  firstDueDate?: InputMaybe<Scalars['String']['input']>;
  observation?: InputMaybe<Scalars['String']['input']>;
  selectedOption: Scalars['String']['input'];
  simulationId: Scalars['UUID']['input'];
  status?: InputMaybe<Scalars['String']['input']>;
  tagId?: InputMaybe<Scalars['UUID']['input']>;
  title: Scalars['String']['input'];
  upfrontDueDate?: InputMaybe<Scalars['String']['input']>;
};


export type MutationCreateReceivableArgs = {
  amount: Scalars['String']['input'];
  category?: InputMaybe<Scalars['String']['input']>;
  description: Scalars['String']['input'];
  expectedDate: Scalars['String']['input'];
};


export type MutationCreateTagArgs = {
  color?: InputMaybe<Scalars['String']['input']>;
  icon?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
};


export type MutationCreateTransactionArgs = {
  accountId?: InputMaybe<Scalars['UUID']['input']>;
  amount: Scalars['String']['input'];
  category?: InputMaybe<Scalars['String']['input']>;
  creditCardId?: InputMaybe<Scalars['UUID']['input']>;
  currency?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  dueDate: Scalars['String']['input'];
  endDate?: InputMaybe<Scalars['String']['input']>;
  installmentCount?: InputMaybe<Scalars['Int']['input']>;
  isInstallment?: InputMaybe<Scalars['Boolean']['input']>;
  isRecurring?: InputMaybe<Scalars['Boolean']['input']>;
  observation?: InputMaybe<Scalars['String']['input']>;
  startDate?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<TransactionStatus>;
  tagId?: InputMaybe<Scalars['UUID']['input']>;
  title: Scalars['String']['input'];
  type: TransactionType;
};


export type MutationDeleteAccountArgs = {
  accountId: Scalars['UUID']['input'];
};


export type MutationDeleteBudgetArgs = {
  budgetId: Scalars['UUID']['input'];
};


export type MutationDeleteGoalArgs = {
  goalId: Scalars['UUID']['input'];
};


export type MutationDeleteInvestmentOperationArgs = {
  investmentId: Scalars['UUID']['input'];
  operationId: Scalars['UUID']['input'];
};


export type MutationDeleteTagArgs = {
  tagId: Scalars['UUID']['input'];
};


export type MutationDeleteTickerArgs = {
  symbol: Scalars['String']['input'];
};


export type MutationDeleteTransactionArgs = {
  transactionId: Scalars['UUID']['input'];
};


export type MutationDeleteWalletEntryArgs = {
  investmentId: Scalars['UUID']['input'];
};


export type MutationForgotPasswordArgs = {
  email: Scalars['String']['input'];
};


export type MutationLoginArgs = {
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
};


export type MutationMarkReceivableReceivedArgs = {
  entryId: Scalars['UUID']['input'];
  receivedAmount?: InputMaybe<Scalars['String']['input']>;
  receivedDate: Scalars['String']['input'];
};


export type MutationPreviewBankStatementArgs = {
  bankName: Scalars['String']['input'];
  content: Scalars['String']['input'];
};


export type MutationRegisterUserArgs = {
  email: Scalars['String']['input'];
  investorProfile?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  password: Scalars['String']['input'];
};


export type MutationResendConfirmationEmailArgs = {
  email: Scalars['String']['input'];
};


export type MutationResetPasswordArgs = {
  newPassword: Scalars['String']['input'];
  token: Scalars['String']['input'];
};


export type MutationRevokeSessionArgs = {
  sessionId: Scalars['String']['input'];
};


export type MutationSaveInstallmentVsCashSimulationArgs = {
  cashPrice: Scalars['String']['input'];
  feesEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  feesUpfront?: InputMaybe<Scalars['String']['input']>;
  firstPaymentDelayDays?: InputMaybe<Scalars['Int']['input']>;
  inflationRateAnnual: Scalars['String']['input'];
  installmentAmount?: InputMaybe<Scalars['String']['input']>;
  installmentCount: Scalars['Int']['input'];
  installmentTotal?: InputMaybe<Scalars['String']['input']>;
  opportunityRateAnnual?: InputMaybe<Scalars['String']['input']>;
  opportunityRateType?: InputMaybe<Scalars['String']['input']>;
  scenarioLabel?: InputMaybe<Scalars['String']['input']>;
};


export type MutationSimulateGoalPlanArgs = {
  currentAmount?: InputMaybe<Scalars['String']['input']>;
  monthlyContribution?: InputMaybe<Scalars['String']['input']>;
  monthlyExpenses?: InputMaybe<Scalars['String']['input']>;
  monthlyIncome?: InputMaybe<Scalars['String']['input']>;
  targetAmount: Scalars['String']['input'];
  targetDate?: InputMaybe<Scalars['String']['input']>;
};


export type MutationUpdateAccountArgs = {
  accountId: Scalars['UUID']['input'];
  accountType?: InputMaybe<Scalars['String']['input']>;
  initialBalance?: InputMaybe<Scalars['String']['input']>;
  institution?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
};


export type MutationUpdateBudgetArgs = {
  amount?: InputMaybe<Scalars['String']['input']>;
  budgetId: Scalars['UUID']['input'];
  endDate?: InputMaybe<Scalars['String']['input']>;
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  period?: InputMaybe<Scalars['String']['input']>;
  startDate?: InputMaybe<Scalars['String']['input']>;
  tagId?: InputMaybe<Scalars['String']['input']>;
};


export type MutationUpdateGoalArgs = {
  category?: InputMaybe<Scalars['String']['input']>;
  currentAmount?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  goalId: Scalars['UUID']['input'];
  priority?: InputMaybe<Scalars['Int']['input']>;
  status?: InputMaybe<GoalStatus>;
  targetAmount?: InputMaybe<Scalars['String']['input']>;
  targetDate?: InputMaybe<Scalars['String']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
};


export type MutationUpdateInvestmentOperationArgs = {
  executedAt?: InputMaybe<Scalars['String']['input']>;
  fees?: InputMaybe<Scalars['String']['input']>;
  investmentId: Scalars['UUID']['input'];
  notes?: InputMaybe<Scalars['String']['input']>;
  operationId: Scalars['UUID']['input'];
  operationType?: InputMaybe<Scalars['String']['input']>;
  quantity?: InputMaybe<Scalars['String']['input']>;
  unitPrice?: InputMaybe<Scalars['String']['input']>;
};


export type MutationUpdateNotificationPreferencesArgs = {
  preferences: Array<PreferenceInput>;
};


export type MutationUpdateTagArgs = {
  color?: InputMaybe<Scalars['String']['input']>;
  icon?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  tagId: Scalars['UUID']['input'];
};


export type MutationUpdateTransactionArgs = {
  accountId?: InputMaybe<Scalars['UUID']['input']>;
  amount?: InputMaybe<Scalars['String']['input']>;
  category?: InputMaybe<Scalars['String']['input']>;
  creditCardId?: InputMaybe<Scalars['UUID']['input']>;
  currency?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  dueDate?: InputMaybe<Scalars['String']['input']>;
  endDate?: InputMaybe<Scalars['String']['input']>;
  installmentCount?: InputMaybe<Scalars['Int']['input']>;
  isInstallment?: InputMaybe<Scalars['Boolean']['input']>;
  isRecurring?: InputMaybe<Scalars['Boolean']['input']>;
  observation?: InputMaybe<Scalars['String']['input']>;
  paidAt?: InputMaybe<Scalars['String']['input']>;
  startDate?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<TransactionStatus>;
  tagId?: InputMaybe<Scalars['UUID']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
  transactionId: Scalars['UUID']['input'];
  type?: InputMaybe<TransactionType>;
};


export type MutationUpdateUserProfileArgs = {
  birthDate?: InputMaybe<Scalars['String']['input']>;
  financialObjectives?: InputMaybe<Scalars['String']['input']>;
  gender?: InputMaybe<Scalars['String']['input']>;
  initialInvestment?: InputMaybe<Scalars['DecimalScalar']['input']>;
  investmentGoalDate?: InputMaybe<Scalars['String']['input']>;
  investorProfile?: InputMaybe<Scalars['String']['input']>;
  investorProfileSuggested?: InputMaybe<Scalars['String']['input']>;
  monthlyExpenses?: InputMaybe<Scalars['DecimalScalar']['input']>;
  monthlyIncome?: InputMaybe<Scalars['DecimalScalar']['input']>;
  monthlyIncomeNet?: InputMaybe<Scalars['DecimalScalar']['input']>;
  monthlyInvestment?: InputMaybe<Scalars['DecimalScalar']['input']>;
  netWorth?: InputMaybe<Scalars['DecimalScalar']['input']>;
  occupation?: InputMaybe<Scalars['String']['input']>;
  profileQuizScore?: InputMaybe<Scalars['Int']['input']>;
  stateUf?: InputMaybe<Scalars['String']['input']>;
  taxonomyVersion?: InputMaybe<Scalars['String']['input']>;
};


export type MutationUpdateWalletEntryArgs = {
  annualRate?: InputMaybe<Scalars['DecimalScalar']['input']>;
  assetClass?: InputMaybe<WalletAssetClass>;
  investmentId: Scalars['UUID']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
  quantity?: InputMaybe<Scalars['Int']['input']>;
  registerDate?: InputMaybe<Scalars['String']['input']>;
  shouldBeOnWallet?: InputMaybe<Scalars['Boolean']['input']>;
  targetWithdrawDate?: InputMaybe<Scalars['String']['input']>;
  ticker?: InputMaybe<Scalars['String']['input']>;
  value?: InputMaybe<Scalars['DecimalScalar']['input']>;
};

export type NotificationPreferencesType = {
  __typename?: 'NotificationPreferencesType';
  preferences: Array<Maybe<AlertPreferenceType>>;
};

export type PaginationType = {
  __typename?: 'PaginationType';
  page: Scalars['Int']['output'];
  pages?: Maybe<Scalars['Int']['output']>;
  perPage: Scalars['Int']['output'];
  total: Scalars['Int']['output'];
};

export type PortfolioHistoryItemType = {
  __typename?: 'PortfolioHistoryItemType';
  buyAmount: Scalars['String']['output'];
  buyOperations: Scalars['Int']['output'];
  cumulativeNetInvested: Scalars['String']['output'];
  date: Scalars['String']['output'];
  netInvestedAmount: Scalars['String']['output'];
  sellAmount: Scalars['String']['output'];
  sellOperations: Scalars['Int']['output'];
  totalCurrentValueEstimate: Scalars['String']['output'];
  totalOperations: Scalars['Int']['output'];
  totalProfitLossEstimate: Scalars['String']['output'];
};

export type PortfolioHistoryPayloadType = {
  __typename?: 'PortfolioHistoryPayloadType';
  items: Array<Maybe<PortfolioHistoryItemType>>;
  summary: PortfolioHistorySummaryType;
};

export type PortfolioHistorySummaryType = {
  __typename?: 'PortfolioHistorySummaryType';
  endDate: Scalars['String']['output'];
  finalCumulativeNetInvested: Scalars['String']['output'];
  finalTotalCurrentValueEstimate: Scalars['String']['output'];
  finalTotalProfitLossEstimate: Scalars['String']['output'];
  startDate: Scalars['String']['output'];
  totalBuyAmount: Scalars['String']['output'];
  totalNetInvestedAmount: Scalars['String']['output'];
  totalPoints: Scalars['Int']['output'];
  totalSellAmount: Scalars['String']['output'];
};

export type PortfolioValuationItemType = {
  __typename?: 'PortfolioValuationItemType';
  annualRate?: Maybe<Scalars['String']['output']>;
  assetClass: Scalars['String']['output'];
  currentValue: Scalars['String']['output'];
  investedAmount: Scalars['String']['output'];
  investmentId: Scalars['ID']['output'];
  marketPrice?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  profitLossAmount: Scalars['String']['output'];
  profitLossPercent: Scalars['String']['output'];
  quantity: Scalars['String']['output'];
  shouldBeOnWallet: Scalars['Boolean']['output'];
  ticker?: Maybe<Scalars['String']['output']>;
  unitPrice: Scalars['String']['output'];
  usesOperationsQuantity: Scalars['Boolean']['output'];
  valuationSource: Scalars['String']['output'];
};

export type PortfolioValuationPayloadType = {
  __typename?: 'PortfolioValuationPayloadType';
  items: Array<Maybe<PortfolioValuationItemType>>;
  summary: PortfolioValuationSummaryType;
};

export type PortfolioValuationSummaryType = {
  __typename?: 'PortfolioValuationSummaryType';
  totalCurrentValue: Scalars['String']['output'];
  totalInvestedAmount: Scalars['String']['output'];
  totalInvestments: Scalars['Int']['output'];
  totalProfitLoss: Scalars['String']['output'];
  totalProfitLossPercent: Scalars['String']['output'];
  withMarketData: Scalars['Int']['output'];
  withoutMarketData: Scalars['Int']['output'];
};

export type PreferenceInput = {
  category: Scalars['String']['input'];
  enabled: Scalars['Boolean']['input'];
  globalOptOut?: InputMaybe<Scalars['Boolean']['input']>;
};

export type Query = {
  __typename?: 'Query';
  account?: Maybe<AccountType>;
  accounts?: Maybe<AccountListType>;
  aiInsightHistory?: Maybe<AiInsightHistoryResultType>;
  billingPlans?: Maybe<BillingPlanListPayloadType>;
  budget?: Maybe<BudgetType>;
  budgetSummary?: Maybe<BudgetSummaryType>;
  budgets?: Maybe<BudgetListPayloadType>;
  dashboardOverview?: Maybe<TransactionDashboardPayloadType>;
  fiscalDocuments?: Maybe<FiscalDocumentListType>;
  goal?: Maybe<GoalTypeObject>;
  goalPlan?: Maybe<GoalPlanType>;
  goals?: Maybe<GoalListPayloadType>;
  installmentVsCashCalculate?: Maybe<InstallmentVsCashCalculationPayloadType>;
  investmentInvestedAmount?: Maybe<InvestmentInvestedAmountType>;
  investmentOperationSummary?: Maybe<InvestmentOperationSummaryType>;
  investmentOperations?: Maybe<InvestmentOperationListPayloadType>;
  investmentPosition?: Maybe<InvestmentPositionType>;
  investmentValuation?: Maybe<PortfolioValuationItemType>;
  me?: Maybe<UserType>;
  mySubscription?: Maybe<SubscriptionType>;
  notificationPreferences?: Maybe<NotificationPreferencesType>;
  portfolioValuation?: Maybe<PortfolioValuationPayloadType>;
  portfolioValuationHistory?: Maybe<PortfolioHistoryPayloadType>;
  receivables?: Maybe<ReceivableListType>;
  receivablesSummary?: Maybe<ReceivableSummaryType>;
  simulation?: Maybe<SimulationType>;
  simulations: SimulationListPayloadType;
  tag?: Maybe<TagType>;
  tags?: Maybe<TagListType>;
  tickers?: Maybe<TickerListPayloadType>;
  transaction?: Maybe<TransactionTypeObject>;
  /** @deprecated Use dashboardOverview. */
  transactionDashboard?: Maybe<TransactionDashboardPayloadType>;
  transactionDueRange?: Maybe<TransactionDueRangePayloadType>;
  transactionSummary?: Maybe<TransactionSummaryPayloadType>;
  transactions?: Maybe<TransactionListPayloadType>;
  walletEntries?: Maybe<WalletListPayloadType>;
  walletHistory?: Maybe<WalletHistoryPayloadType>;
  weeklySummary?: Maybe<WeeklySummaryPayloadType>;
};


export type QueryAccountArgs = {
  accountId: Scalars['UUID']['input'];
};


export type QueryAiInsightHistoryArgs = {
  page?: InputMaybe<Scalars['Int']['input']>;
  perPage?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryBudgetArgs = {
  budgetId: Scalars['UUID']['input'];
};


export type QueryDashboardOverviewArgs = {
  month: Scalars['String']['input'];
};


export type QueryFiscalDocumentsArgs = {
  type?: InputMaybe<Scalars['String']['input']>;
};


export type QueryGoalArgs = {
  goalId: Scalars['UUID']['input'];
};


export type QueryGoalPlanArgs = {
  goalId: Scalars['UUID']['input'];
};


export type QueryGoalsArgs = {
  page?: InputMaybe<Scalars['Int']['input']>;
  perPage?: InputMaybe<Scalars['Int']['input']>;
  status?: InputMaybe<Scalars['String']['input']>;
};


export type QueryInstallmentVsCashCalculateArgs = {
  cashPrice: Scalars['String']['input'];
  feesEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  feesUpfront?: InputMaybe<Scalars['String']['input']>;
  firstPaymentDelayDays?: InputMaybe<Scalars['Int']['input']>;
  inflationRateAnnual: Scalars['String']['input'];
  installmentAmount?: InputMaybe<Scalars['String']['input']>;
  installmentCount: Scalars['Int']['input'];
  installmentTotal?: InputMaybe<Scalars['String']['input']>;
  opportunityRateAnnual?: InputMaybe<Scalars['String']['input']>;
  opportunityRateType?: InputMaybe<Scalars['String']['input']>;
  scenarioLabel?: InputMaybe<Scalars['String']['input']>;
};


export type QueryInvestmentInvestedAmountArgs = {
  date: Scalars['String']['input'];
  investmentId: Scalars['UUID']['input'];
};


export type QueryInvestmentOperationSummaryArgs = {
  investmentId: Scalars['UUID']['input'];
};


export type QueryInvestmentOperationsArgs = {
  investmentId: Scalars['UUID']['input'];
  page?: InputMaybe<Scalars['Int']['input']>;
  perPage?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryInvestmentPositionArgs = {
  investmentId: Scalars['UUID']['input'];
};


export type QueryInvestmentValuationArgs = {
  investmentId: Scalars['UUID']['input'];
};


export type QueryPortfolioValuationHistoryArgs = {
  finalDate?: InputMaybe<Scalars['String']['input']>;
  startDate?: InputMaybe<Scalars['String']['input']>;
};


export type QueryReceivablesArgs = {
  status?: InputMaybe<Scalars['String']['input']>;
};


export type QuerySimulationArgs = {
  id: Scalars['UUID']['input'];
};


export type QuerySimulationsArgs = {
  page?: InputMaybe<Scalars['Int']['input']>;
  perPage?: InputMaybe<Scalars['Int']['input']>;
  toolId?: InputMaybe<Scalars['String']['input']>;
};


export type QueryTagArgs = {
  tagId: Scalars['UUID']['input'];
};


export type QueryTickersArgs = {
  page?: InputMaybe<Scalars['Int']['input']>;
  perPage?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryTransactionArgs = {
  transactionId: Scalars['UUID']['input'];
};


export type QueryTransactionDashboardArgs = {
  month: Scalars['String']['input'];
};


export type QueryTransactionDueRangeArgs = {
  endDate?: InputMaybe<Scalars['String']['input']>;
  finalDate?: InputMaybe<Scalars['String']['input']>;
  initialDate?: InputMaybe<Scalars['String']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  perPage?: InputMaybe<Scalars['Int']['input']>;
  startDate?: InputMaybe<Scalars['String']['input']>;
};


export type QueryTransactionSummaryArgs = {
  month: Scalars['String']['input'];
  page?: InputMaybe<Scalars['Int']['input']>;
  pageSize?: InputMaybe<Scalars['Int']['input']>;
  perPage?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryTransactionsArgs = {
  accountId?: InputMaybe<Scalars['UUID']['input']>;
  creditCardId?: InputMaybe<Scalars['UUID']['input']>;
  endDate?: InputMaybe<Scalars['String']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  perPage?: InputMaybe<Scalars['Int']['input']>;
  startDate?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<Scalars['String']['input']>;
  tagId?: InputMaybe<Scalars['UUID']['input']>;
  type?: InputMaybe<Scalars['String']['input']>;
};


export type QueryWalletEntriesArgs = {
  page?: InputMaybe<Scalars['Int']['input']>;
  perPage?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryWalletHistoryArgs = {
  investmentId: Scalars['UUID']['input'];
  page?: InputMaybe<Scalars['Int']['input']>;
  perPage?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryWeeklySummaryArgs = {
  endDate?: InputMaybe<Scalars['String']['input']>;
  period?: InputMaybe<Scalars['String']['input']>;
  startDate?: InputMaybe<Scalars['String']['input']>;
};

/**
 * IMPORTANT: expected_net_amount is advisory-only. Clients MUST display
 * the ``disclaimer`` field alongside any monetary value derived from it.
 */
export type ReceivableEntryType = {
  __typename?: 'ReceivableEntryType';
  createdAt: Scalars['String']['output'];
  disclaimer: Scalars['String']['output'];
  expectedNetAmount?: Maybe<Scalars['DecimalScalar']['output']>;
  fiscalDocumentId: Scalars['ID']['output'];
  id: Scalars['ID']['output'];
  outstandingAmount?: Maybe<Scalars['DecimalScalar']['output']>;
  receivedAmount?: Maybe<Scalars['DecimalScalar']['output']>;
  receivedAt?: Maybe<Scalars['String']['output']>;
  reconciliationStatus: Scalars['String']['output'];
};

export type ReceivableListType = {
  __typename?: 'ReceivableListType';
  receivables: Array<ReceivableEntryType>;
  total: Scalars['Int']['output'];
};

export type ReceivablePayload = {
  __typename?: 'ReceivablePayload';
  data?: Maybe<ReceivableEntryType>;
  /** Field-level validation errors (empty on success). */
  errors: Array<ValidationError>;
  /** Human-readable status message. */
  message: Scalars['String']['output'];
  /** True when the mutation completed without errors. */
  ok: Scalars['Boolean']['output'];
};

/**
 * IMPORTANT: all monetary values are advisory-only estimates.
 * Always display the ``disclaimer`` field.
 */
export type ReceivableSummaryType = {
  __typename?: 'ReceivableSummaryType';
  disclaimer: Scalars['String']['output'];
  expectedTotal: Scalars['String']['output'];
  pendingTotal: Scalars['String']['output'];
  receivedTotal: Scalars['String']['output'];
};

/** Revoke all active sessions — global logout (#1028). */
export type RevokeAllSessionsMutation = {
  __typename?: 'RevokeAllSessionsMutation';
  ok: Scalars['Boolean']['output'];
  revoked: Scalars['Int']['output'];
};

/** Revoke a specific session by ID (multi-device, #1028). */
export type RevokeSessionMutation = {
  __typename?: 'RevokeSessionMutation';
  message: Scalars['String']['output'];
  ok: Scalars['Boolean']['output'];
};

export type SaveInstallmentVsCashSimulationMutation = {
  __typename?: 'SaveInstallmentVsCashSimulationMutation';
  calculation: InstallmentVsCashCalculationPayloadType;
  message: Scalars['String']['output'];
  simulation: InstallmentVsCashSimulationType;
};

export type SelectedEntryInput = {
  amount: Scalars['String']['input'];
  bankName: Scalars['String']['input'];
  date: Scalars['String']['input'];
  description: Scalars['String']['input'];
  externalId: Scalars['String']['input'];
  transactionType: Scalars['String']['input'];
};

export type SimulateGoalPlanMutation = {
  __typename?: 'SimulateGoalPlanMutation';
  goalPlan: GoalPlanType;
  message: Scalars['String']['output'];
};

export type SimulationListPayloadType = {
  __typename?: 'SimulationListPayloadType';
  items: Array<Maybe<SimulationType>>;
  page: Scalars['Int']['output'];
  pages: Scalars['Int']['output'];
  perPage: Scalars['Int']['output'];
  total: Scalars['Int']['output'];
};

/** Generic persisted simulation envelope (DEC-196 / #1128). */
export type SimulationType = {
  __typename?: 'SimulationType';
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['UUID']['output'];
  inputs: Scalars['JSONString']['output'];
  metadata?: Maybe<Scalars['JSONString']['output']>;
  result: Scalars['JSONString']['output'];
  ruleVersion: Scalars['String']['output'];
  saved: Scalars['Boolean']['output'];
  toolId: Scalars['String']['output'];
  userId: Scalars['UUID']['output'];
};

export type SubscriptionType = {
  __typename?: 'SubscriptionType';
  billingCycle?: Maybe<Scalars['String']['output']>;
  canceledAt?: Maybe<Scalars['String']['output']>;
  createdAt?: Maybe<Scalars['String']['output']>;
  currentPeriodEnd?: Maybe<Scalars['String']['output']>;
  currentPeriodStart?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  offerCode?: Maybe<Scalars['String']['output']>;
  planCode: Scalars['String']['output'];
  provider?: Maybe<Scalars['String']['output']>;
  providerSubscriptionId?: Maybe<Scalars['String']['output']>;
  status: Scalars['String']['output'];
  trialEndsAt?: Maybe<Scalars['String']['output']>;
  updatedAt?: Maybe<Scalars['String']['output']>;
};

export type TagListType = {
  __typename?: 'TagListType';
  tags: Array<TagType>;
  total: Scalars['Int']['output'];
};

export type TagPayload = {
  __typename?: 'TagPayload';
  data?: Maybe<TagType>;
  /** Field-level validation errors (empty on success). */
  errors: Array<ValidationError>;
  /** Human-readable status message. */
  message: Scalars['String']['output'];
  /** True when the mutation completed without errors. */
  ok: Scalars['Boolean']['output'];
};

export type TagType = {
  __typename?: 'TagType';
  color?: Maybe<Scalars['String']['output']>;
  icon?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
};

export type TickerListPayloadType = {
  __typename?: 'TickerListPayloadType';
  items: Array<Maybe<TickerType>>;
  pagination: PaginationType;
};

export type TickerType = {
  __typename?: 'TickerType';
  id: Scalars['ID']['output'];
  quantity: Scalars['Float']['output'];
  symbol: Scalars['String']['output'];
  type?: Maybe<Scalars['String']['output']>;
};

export type TransactionDashboardPayloadType = {
  __typename?: 'TransactionDashboardPayloadType';
  counts: DashboardCountsType;
  month: Scalars['String']['output'];
  topCategories: DashboardCategoriesType;
  totals: DashboardTotalsType;
};

export type TransactionDueCountsType = {
  __typename?: 'TransactionDueCountsType';
  expenseTransactions: Scalars['Int']['output'];
  incomeTransactions: Scalars['Int']['output'];
  totalTransactions: Scalars['Int']['output'];
};

export type TransactionDueRangePayloadType = {
  __typename?: 'TransactionDueRangePayloadType';
  counts: TransactionDueCountsType;
  items: Array<Maybe<TransactionTypeObject>>;
  pagination: PaginationType;
};

export type TransactionListPayloadType = {
  __typename?: 'TransactionListPayloadType';
  items: Array<Maybe<TransactionTypeObject>>;
  pagination: PaginationType;
};

/** An enumeration. */
export type TransactionStatus =
  | 'CANCELLED'
  | 'OVERDUE'
  | 'PAID'
  | 'PENDING'
  | 'POSTPONED';

export type TransactionSummaryPayloadType = {
  __typename?: 'TransactionSummaryPayloadType';
  expenseTotal: Scalars['DecimalScalar']['output'];
  incomeTotal: Scalars['DecimalScalar']['output'];
  items: Array<Maybe<TransactionTypeObject>>;
  month: Scalars['String']['output'];
  pagination: PaginationType;
};

/** An enumeration. */
export type TransactionType =
  | 'EXPENSE'
  | 'INCOME';

export type TransactionTypeObject = {
  __typename?: 'TransactionTypeObject';
  accountId?: Maybe<Scalars['String']['output']>;
  amount: Scalars['String']['output'];
  bankName?: Maybe<Scalars['String']['output']>;
  category?: Maybe<Scalars['String']['output']>;
  createdAt?: Maybe<Scalars['String']['output']>;
  creditCardId?: Maybe<Scalars['String']['output']>;
  currency: Scalars['String']['output'];
  description?: Maybe<Scalars['String']['output']>;
  dueDate: Scalars['String']['output'];
  endDate?: Maybe<Scalars['String']['output']>;
  externalId?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  installmentCount?: Maybe<Scalars['Int']['output']>;
  installmentGroupId?: Maybe<Scalars['String']['output']>;
  isInstallment: Scalars['Boolean']['output'];
  isRecurring: Scalars['Boolean']['output'];
  observation?: Maybe<Scalars['String']['output']>;
  paidAt?: Maybe<Scalars['String']['output']>;
  source: Scalars['String']['output'];
  startDate?: Maybe<Scalars['String']['output']>;
  status: Scalars['String']['output'];
  tagId?: Maybe<Scalars['String']['output']>;
  title: Scalars['String']['output'];
  type: Scalars['String']['output'];
  updatedAt?: Maybe<Scalars['String']['output']>;
};

export type UpdateBudgetMutation = {
  __typename?: 'UpdateBudgetMutation';
  budget: BudgetType;
  message: Scalars['String']['output'];
};

export type UpdateGoalMutation = {
  __typename?: 'UpdateGoalMutation';
  goal: GoalTypeObject;
  message: Scalars['String']['output'];
};

export type UpdateInvestmentOperationMutation = {
  __typename?: 'UpdateInvestmentOperationMutation';
  item: InvestmentOperationType;
  message: Scalars['String']['output'];
};

/** Canonical payload for updateNotificationPreferences mutation. */
export type UpdateNotificationPreferencesPayload = {
  __typename?: 'UpdateNotificationPreferencesPayload';
  /** The updated preference records. */
  data?: Maybe<Array<AlertPreferenceType>>;
  /** Field-level validation errors (empty on success). */
  errors: Array<ValidationError>;
  /** Human-readable status message. */
  message: Scalars['String']['output'];
  /** True when the mutation completed without errors. */
  ok: Scalars['Boolean']['output'];
};

export type UpdateTransactionMutation = {
  __typename?: 'UpdateTransactionMutation';
  message: Scalars['String']['output'];
  transaction: TransactionTypeObject;
};

export type UpdateUserProfileMutation = {
  __typename?: 'UpdateUserProfileMutation';
  user: UserType;
};

export type UpdateWalletEntryMutation = {
  __typename?: 'UpdateWalletEntryMutation';
  item: WalletType;
};

export type UserType = {
  __typename?: 'UserType';
  avatarUrl?: Maybe<Scalars['String']['output']>;
  birthDate?: Maybe<Scalars['String']['output']>;
  email: Scalars['String']['output'];
  financialObjectives?: Maybe<Scalars['String']['output']>;
  gender?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  initialInvestment?: Maybe<Scalars['DecimalScalar']['output']>;
  investmentGoalDate?: Maybe<Scalars['String']['output']>;
  investorProfile?: Maybe<Scalars['String']['output']>;
  investorProfileSuggested?: Maybe<Scalars['String']['output']>;
  monthlyExpenses?: Maybe<Scalars['DecimalScalar']['output']>;
  monthlyIncome?: Maybe<Scalars['DecimalScalar']['output']>;
  monthlyIncomeNet?: Maybe<Scalars['DecimalScalar']['output']>;
  monthlyInvestment?: Maybe<Scalars['DecimalScalar']['output']>;
  name: Scalars['String']['output'];
  netWorth?: Maybe<Scalars['DecimalScalar']['output']>;
  occupation?: Maybe<Scalars['String']['output']>;
  profileQuizScore?: Maybe<Scalars['Int']['output']>;
  stateUf?: Maybe<Scalars['String']['output']>;
  taxonomyVersion?: Maybe<Scalars['String']['output']>;
};

/** A single field-level validation failure inside a mutation payload. */
export type ValidationError = {
  __typename?: 'ValidationError';
  /** The input field that failed validation, or null for document-level errors. */
  field?: Maybe<Scalars['String']['output']>;
  /** Human-readable description of the failure. */
  message: Scalars['String']['output'];
};

/** An enumeration. */
export type WalletAssetClass =
  | 'BDR'
  | 'CDB'
  | 'CDI'
  | 'CRYPTO'
  | 'CUSTOM'
  | 'ETF'
  | 'FII'
  | 'FUND'
  | 'LCA'
  | 'LCI'
  | 'STOCK'
  | 'TESOURO';

export type WalletHistoryItemType = {
  __typename?: 'WalletHistoryItemType';
  changeDate?: Maybe<Scalars['String']['output']>;
  changeType?: Maybe<Scalars['String']['output']>;
  originalQuantity?: Maybe<Scalars['DecimalScalar']['output']>;
  originalValue?: Maybe<Scalars['DecimalScalar']['output']>;
};

export type WalletHistoryPayloadType = {
  __typename?: 'WalletHistoryPayloadType';
  items: Array<Maybe<WalletHistoryItemType>>;
  pagination: PaginationType;
};

export type WalletListPayloadType = {
  __typename?: 'WalletListPayloadType';
  items: Array<Maybe<WalletType>>;
  pagination: PaginationType;
};

export type WalletType = {
  __typename?: 'WalletType';
  annualRate?: Maybe<Scalars['DecimalScalar']['output']>;
  assetClass: Scalars['String']['output'];
  estimatedValueOnCreateDate?: Maybe<Scalars['DecimalScalar']['output']>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  quantity?: Maybe<Scalars['Int']['output']>;
  registerDate: Scalars['String']['output'];
  shouldBeOnWallet: Scalars['Boolean']['output'];
  targetWithdrawDate?: Maybe<Scalars['String']['output']>;
  ticker?: Maybe<Scalars['String']['output']>;
  value?: Maybe<Scalars['DecimalScalar']['output']>;
};

export type WeeklyComparisonType = {
  __typename?: 'WeeklyComparisonType';
  balanceDelta: Scalars['DecimalScalar']['output'];
  balanceDeltaPercent?: Maybe<Scalars['Float']['output']>;
  expenseDelta: Scalars['DecimalScalar']['output'];
  expenseDeltaPercent?: Maybe<Scalars['Float']['output']>;
  incomeDelta: Scalars['DecimalScalar']['output'];
  incomeDeltaPercent?: Maybe<Scalars['Float']['output']>;
};

export type WeeklyPeriodTotalsType = {
  __typename?: 'WeeklyPeriodTotalsType';
  balance: Scalars['DecimalScalar']['output'];
  end: Scalars['String']['output'];
  expense: Scalars['DecimalScalar']['output'];
  income: Scalars['DecimalScalar']['output'];
  start: Scalars['String']['output'];
  transactionCount: Scalars['Int']['output'];
};

export type WeeklySummaryPayloadType = {
  __typename?: 'WeeklySummaryPayloadType';
  comparison: WeeklyComparisonType;
  currentWeek: WeeklyPeriodTotalsType;
  period: Scalars['String']['output'];
  previousWeek: WeeklyPeriodTotalsType;
  series: Array<Maybe<WeeklySummarySeriesEntryType>>;
  seriesEnd: Scalars['String']['output'];
  seriesStart: Scalars['String']['output'];
};

export type WeeklySummarySeriesEntryType = {
  __typename?: 'WeeklySummarySeriesEntryType';
  balance: Scalars['DecimalScalar']['output'];
  date: Scalars['String']['output'];
  expense: Scalars['DecimalScalar']['output'];
  income: Scalars['DecimalScalar']['output'];
};
