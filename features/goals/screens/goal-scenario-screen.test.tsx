import { fireEvent, render } from "@testing-library/react-native";

import { TestProviders } from "@/shared/testing/test-providers";

import { GoalScenarioScreen } from "@/features/goals/screens/goal-scenario-screen";
import type { GoalScenarioScreenController } from "@/features/goals/hooks/use-goal-scenario-screen-controller";
import type { GoalProjectionScenario } from "@/features/goals/services/goal-scenario-projector";

const mockSetMonthlyContribution = jest.fn();
const mockSetHorizonMonths = jest.fn();
const mockSetAnnualReturnRatePct = jest.fn();
const mockHandleSaveTargetDate = jest.fn();
const mockHandleResetToBaseline = jest.fn();
const mockHandleBack = jest.fn();

const buildScenario = (): GoalProjectionScenario => ({
  points: [{ month: 1, balance: 600 }],
  finalBalance: 12_000,
  monthsToTarget: 18,
  remainingGap: 0,
});

let mockController: Partial<GoalScenarioScreenController> = {};

jest.mock("@/features/goals/hooks/use-goal-scenario-screen-controller", () => ({
  useGoalScenarioScreenController: () => ({
    goalId: "g-1",
    goal: {
      id: "g-1",
      title: "Reserva",
      currentAmount: 5_000,
      targetAmount: 30_000,
      targetDate: null,
      status: "active",
    },
    baseline: null,
    form: {
      monthlyContribution: 500,
      horizonMonths: 24,
      annualReturnRatePct: 10,
    },
    scenario: buildScenario(),
    projectedCompletionDate: "2027-01-01",
    hasInitialised: true,
    isLoadingGoals: false,
    isLoadingProjection: false,
    isSaving: false,
    saveError: null,
    setMonthlyContribution: mockSetMonthlyContribution,
    setHorizonMonths: mockSetHorizonMonths,
    setAnnualReturnRatePct: mockSetAnnualReturnRatePct,
    handleSaveTargetDate: mockHandleSaveTargetDate,
    handleResetToBaseline: mockHandleResetToBaseline,
    handleBack: mockHandleBack,
    ...mockController,
  }),
}));

describe("GoalScenarioScreen", () => {
  beforeEach(() => {
    mockSetMonthlyContribution.mockReset();
    mockSetHorizonMonths.mockReset();
    mockSetAnnualReturnRatePct.mockReset();
    mockHandleSaveTargetDate.mockReset();
    mockHandleResetToBaseline.mockReset();
    mockHandleBack.mockReset();
    mockController = {};
  });

  it("renders header with the goal title", () => {
    const { getByText } = render(
      <TestProviders>
        <GoalScenarioScreen />
      </TestProviders>,
    );
    expect(getByText("Simulador de cenário")).toBeTruthy();
    expect(getByText("Reserva")).toBeTruthy();
  });

  it("renders projection metrics from the scenario", () => {
    const { getByText } = render(
      <TestProviders>
        <GoalScenarioScreen />
      </TestProviders>,
    );
    expect(getByText(/18 meses/iu)).toBeTruthy();
  });

  it("primary CTA invokes handleSaveTargetDate", () => {
    const { getByText } = render(
      <TestProviders>
        <GoalScenarioScreen />
      </TestProviders>,
    );
    fireEvent.press(getByText(/Salvar nova data alvo/iu));
    expect(mockHandleSaveTargetDate).toHaveBeenCalledTimes(1);
  });

  it("reset CTA invokes handleResetToBaseline", () => {
    const { getByText } = render(
      <TestProviders>
        <GoalScenarioScreen />
      </TestProviders>,
    );
    fireEvent.press(getByText(/Resetar/iu));
    expect(mockHandleResetToBaseline).toHaveBeenCalledTimes(1);
  });

  it("back CTA invokes handleBack", () => {
    const { getByText } = render(
      <TestProviders>
        <GoalScenarioScreen />
      </TestProviders>,
    );
    fireEvent.press(getByText("Voltar"));
    expect(mockHandleBack).toHaveBeenCalledTimes(1);
  });

  it("renders the baseline projection metadata when present", () => {
    mockController = {
      baseline: {
        goalId: "g-1",
        projectedFinishDate: "2027-09-15",
        projectedAmountAtTarget: 30_000,
        assumptions: { annualReturnRate: 12, monthlyContribution: 700 },
      },
    };
    const { getByText } = render(
      <TestProviders>
        <GoalScenarioScreen />
      </TestProviders>,
    );
    expect(getByText("Baseline (API)")).toBeTruthy();
    expect(getByText("Taxa baseline")).toBeTruthy();
  });

  it("renders the save error notice when the mutation failed", () => {
    mockController = { saveError: new Error("server says no") };
    const { getByText } = render(
      <TestProviders>
        <GoalScenarioScreen />
      </TestProviders>,
    );
    expect(getByText(/Não foi possível salvar/iu)).toBeTruthy();
  });

  it("disables the save CTA while saving and reflects the busy label", () => {
    mockController = { isSaving: true };
    const { getByText } = render(
      <TestProviders>
        <GoalScenarioScreen />
      </TestProviders>,
    );
    expect(getByText("Salvando...")).toBeTruthy();
  });

  it("monthly contribution input invokes setMonthlyContribution with the parsed amount", () => {
    const { getByDisplayValue } = render(
      <TestProviders>
        <GoalScenarioScreen />
      </TestProviders>,
    );
    fireEvent.changeText(getByDisplayValue("500"), "1.500,75");
    expect(mockSetMonthlyContribution).toHaveBeenCalledWith(1500.75);
  });

  it("horizon input invokes setHorizonMonths as integer", () => {
    const { getByDisplayValue } = render(
      <TestProviders>
        <GoalScenarioScreen />
      </TestProviders>,
    );
    fireEvent.changeText(getByDisplayValue("24"), "36");
    expect(mockSetHorizonMonths).toHaveBeenCalledWith(36);
  });

  it("annual rate input invokes setAnnualReturnRatePct", () => {
    const { getByDisplayValue } = render(
      <TestProviders>
        <GoalScenarioScreen />
      </TestProviders>,
    );
    fireEvent.changeText(getByDisplayValue("10"), "12,5");
    expect(mockSetAnnualReturnRatePct).toHaveBeenCalledWith(12.5);
  });

  it("renders 'Não atinge no horizonte' when the scenario never reaches target", () => {
    mockController = {
      scenario: {
        points: [],
        finalBalance: 100,
        monthsToTarget: null,
        remainingGap: 29_900,
      },
      projectedCompletionDate: null,
    };
    const { getByText } = render(
      <TestProviders>
        <GoalScenarioScreen />
      </TestProviders>,
    );
    expect(getByText(/Não atinge no horizonte/iu)).toBeTruthy();
  });
});
