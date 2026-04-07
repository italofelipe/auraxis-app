import { render } from "@testing-library/react-native";
import InstallmentVsCashScreen from "@/app/(private)/installment-vs-cash";
import { AppProviders } from "@/core/providers/app-providers";
import { useInstallmentVsCashScreenController } from "@/features/tools/hooks/use-installment-vs-cash-screen-controller";
import type {
  InstallmentVsCashCalculation,
  InstallmentVsCashSavedSimulation,
} from "@/features/tools/contracts";
import type { UseMutationResult, UseQueryResult } from "@tanstack/react-query";

jest.mock("@/features/tools/hooks/use-installment-vs-cash-screen-controller", () => ({
  useInstallmentVsCashScreenController: jest.fn(),
}));

const mockedUseInstallmentVsCashScreenController = jest.mocked(
  useInstallmentVsCashScreenController,
);

const buildCalculation = (): InstallmentVsCashCalculation => ({
  toolId: "installment_vs_cash",
  ruleVersion: "2026.1",
  input: {
    cashPrice: 1000,
    installmentCount: 6,
    installmentAmount: 200,
    installmentTotal: 1200,
    firstPaymentDelayDays: 30,
    opportunityRateType: "manual",
    opportunityRateAnnual: 12,
    inflationRateAnnual: 4.5,
    feesUpfront: 0,
    scenarioLabel: "Notebook",
  },
  result: {
    recommendedOption: "cash",
    recommendationReason: "A vista vence.",
    formulaExplainer: "Explicacao",
    comparison: {
      cashOptionTotal: 1000,
      installmentOptionTotal: 1200,
      installmentPresentValue: 1050,
      installmentRealValueToday: 1030,
      presentValueDeltaVsCash: 50,
      absoluteDeltaVsCash: 200,
      relativeDeltaVsCashPercent: 5,
      breakEvenDiscountPercent: 7,
      breakEvenOpportunityRateAnnual: 14,
    },
    options: {
      cash: { total: 1000 },
      installment: {
        count: 6,
        amounts: [200, 200, 200],
        installmentAmount: 200,
        nominalTotal: 1200,
        upfrontFees: 0,
        firstPaymentDelayDays: 30,
      },
    },
    neutralityBand: {
      absoluteBrl: 25,
      relativePercent: 1.5,
    },
    assumptions: {
      opportunityRateType: "manual",
      opportunityRateAnnualPercent: 12,
      inflationRateAnnualPercent: 4.5,
      periodicity: "monthly",
      firstPaymentDelayDays: 30,
      upfrontFeesApplyTo: "installment",
      neutralityRule: "mixed",
    },
    indicatorSnapshot: null,
    schedule: [],
  },
});

const buildMutation = (): UseMutationResult<unknown, Error, unknown, unknown> => ({
  data: undefined,
  error: null,
  failureCount: 0,
  failureReason: null,
  isError: false,
  isIdle: true,
  isPending: false,
  isPaused: false,
  isSuccess: false,
  mutate: jest.fn(),
  mutateAsync: jest.fn(),
  reset: jest.fn(),
  status: "idle",
  submittedAt: 0,
  variables: undefined,
} as unknown as UseMutationResult<unknown, Error, unknown, unknown>);

const buildQuery = <TData,>(
  data: TData,
): UseQueryResult<TData, Error> => ({
  data,
  error: null,
  failureCount: 0,
  failureReason: null,
  fetchStatus: "idle",
  isError: false,
  isFetched: true,
  isFetchedAfterMount: true,
  isFetching: false,
  isInitialLoading: false,
  isLoading: false,
  isLoadingError: false,
  isPaused: false,
  isPending: false,
  isPlaceholderData: false,
  isRefetchError: false,
  isRefetching: false,
  isStale: false,
  isSuccess: true,
  refetch: jest.fn(),
  status: "success",
  dataUpdatedAt: 0,
  errorUpdatedAt: 0,
  isEnabled: true,
  promise: Promise.resolve(data),
} as unknown as UseQueryResult<TData, Error>);

const buildController = (
  overrides: Partial<ReturnType<typeof useInstallmentVsCashScreenController>> = {},
): ReturnType<typeof useInstallmentVsCashScreenController> => ({
  draft: {
    scenarioLabel: "",
    cashPrice: "",
    installmentCount: "6",
    installmentInputMode: "total",
    installmentAmount: "",
    installmentTotal: "",
    firstPaymentDelayPreset: "30_days",
    customFirstPaymentDelayDays: "",
    opportunityRateType: "manual",
    opportunityRateAnnual: "12",
    inflationRateAnnual: "4.5",
    feesEnabled: false,
    feesUpfront: "",
  },
  errors: {},
  calculation: null,
  selectedOption: "cash",
  historyQuery: buildQuery<readonly InstallmentVsCashSavedSimulation[]>([]),
  premiumQuery: buildQuery(false),
  calculateMutation: {
    ...buildMutation(),
    isPending: false,
    isError: false,
  } as ReturnType<typeof useInstallmentVsCashScreenController>["calculateMutation"],
  saveMutation:
    buildMutation() as ReturnType<
      typeof useInstallmentVsCashScreenController
    >["saveMutation"],
  createGoalMutation:
    buildMutation() as ReturnType<typeof useInstallmentVsCashScreenController>["createGoalMutation"],
  createPlannedExpenseMutation:
    buildMutation() as ReturnType<typeof useInstallmentVsCashScreenController>["createPlannedExpenseMutation"],
  setTextField: jest.fn(),
  setInstallmentMode: jest.fn(),
  setDelayPreset: jest.fn(),
  setOpportunityRateType: jest.fn(),
  setFeesEnabled: jest.fn(),
  setSelectedOption: jest.fn(),
  handleGoBack: jest.fn(),
  handleCalculate: jest.fn().mockResolvedValue(undefined),
  handleSave: jest.fn().mockResolvedValue(undefined),
  handleCreateGoal: jest.fn().mockResolvedValue(undefined),
  handleCreatePlannedExpense: jest.fn().mockResolvedValue(undefined),
  ...overrides,
});

describe("InstallmentVsCashScreen", () => {
  beforeEach(() => {
    mockedUseInstallmentVsCashScreenController.mockReturnValue(buildController());
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renderiza a tela base da calculadora", () => {
    const { getByText } = render(
      <AppProviders>
        <InstallmentVsCashScreen />
      </AppProviders>,
    );

    expect(getByText("Parcelado vs a vista")).toBeTruthy();
    expect(getByText("Calcular agora")).toBeTruthy();
  });

  it("renderiza o estado de loading do calculo", () => {
    mockedUseInstallmentVsCashScreenController.mockReturnValue(
      buildController({
        calculateMutation: {
          ...buildMutation(),
          isPending: true,
          isError: false,
        } as ReturnType<typeof useInstallmentVsCashScreenController>["calculateMutation"],
      }),
    );

    const { getByText } = render(
      <AppProviders>
        <InstallmentVsCashScreen />
      </AppProviders>,
    );

    expect(getByText("Calculando cenario")).toBeTruthy();
  });

  it("renderiza o estado de erro do calculo", () => {
    mockedUseInstallmentVsCashScreenController.mockReturnValue(
      buildController({
        calculateMutation: {
          ...buildMutation(),
          isPending: false,
          isError: true,
        } as ReturnType<typeof useInstallmentVsCashScreenController>["calculateMutation"],
      }),
    );

    const { getByText } = render(
      <AppProviders>
        <InstallmentVsCashScreen />
      </AppProviders>,
    );

    expect(getByText("Nao foi possivel calcular agora")).toBeTruthy();
  });

  it("renderiza resultado e historico quando disponiveis", () => {
    mockedUseInstallmentVsCashScreenController.mockReturnValue(
      buildController({
        calculation: buildCalculation(),
        historyQuery: buildQuery<readonly InstallmentVsCashSavedSimulation[]>([
          {
            id: "sim-1",
            userId: "user-1",
            toolId: "installment_vs_cash",
            ruleVersion: "2026.1",
            inputs: buildCalculation().input,
            result: buildCalculation().result,
            saved: true,
            goalId: null,
            createdAt: "2026-03-20T10:00:00Z",
          },
        ]),
      }),
    );

    const { getByText } = render(
      <AppProviders>
        <InstallmentVsCashScreen />
      </AppProviders>,
    );

    expect(getByText("Salvar no planejamento")).toBeTruthy();
    expect(getByText("Ultimas simulacoes salvas")).toBeTruthy();
  });
});
