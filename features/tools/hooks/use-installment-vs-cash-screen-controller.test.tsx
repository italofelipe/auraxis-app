import * as React from "react";
import { act, renderHook } from "@testing-library/react-native";

import { useInstallmentVsCashScreenController } from "./use-installment-vs-cash-screen-controller";
import { useEntitlementCheckQuery } from "@/features/entitlements/hooks/use-entitlement-check-query";
import { useInstallmentVsCashHistoryQuery } from "@/features/tools/hooks/use-installment-vs-cash-history-query";
import { useSessionStore } from "@/core/session/session-store";
import { createInstallmentVsCashActions } from "@/features/tools/hooks/installment-vs-cash/installment-vs-cash-actions";
import { useInstallmentVsCashDraftState } from "@/features/tools/hooks/installment-vs-cash/use-installment-vs-cash-draft-state";
import { useSavedSimulationState } from "@/features/tools/hooks/installment-vs-cash/use-saved-simulation-state";
import {
  useCreateGoalFromInstallmentVsCashMutation,
  useCreatePlannedExpenseFromInstallmentVsCashMutation,
  useInstallmentVsCashCalculationMutation,
  useSaveInstallmentVsCashMutation,
} from "@/features/tools/hooks/use-installment-vs-cash-mutations";
import { getSuggestedSelectedOption } from "@/shared/validators/installment-vs-cash";

const mockBack = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({
    back: mockBack,
  }),
}));

jest.mock("@/core/session/session-store", () => ({
  useSessionStore: jest.fn(),
}));

jest.mock("@/features/tools/hooks/installment-vs-cash/use-installment-vs-cash-draft-state", () => ({
  useInstallmentVsCashDraftState: jest.fn(),
}));

jest.mock("@/features/tools/hooks/installment-vs-cash/use-saved-simulation-state", () => ({
  useSavedSimulationState: jest.fn(),
}));

jest.mock("@/features/tools/hooks/installment-vs-cash/installment-vs-cash-actions", () => ({
  createInstallmentVsCashActions: jest.fn(),
}));

jest.mock("@/features/tools/hooks/use-installment-vs-cash-history-query", () => ({
  useInstallmentVsCashHistoryQuery: jest.fn(),
}));

jest.mock("@/features/entitlements/hooks/use-entitlement-check-query", () => ({
  useEntitlementCheckQuery: jest.fn(),
}));

jest.mock("@/features/tools/hooks/use-installment-vs-cash-mutations", () => ({
  useInstallmentVsCashCalculationMutation: jest.fn(),
  useSaveInstallmentVsCashMutation: jest.fn(),
  useCreateGoalFromInstallmentVsCashMutation: jest.fn(),
  useCreatePlannedExpenseFromInstallmentVsCashMutation: jest.fn(),
}));

jest.mock("@/shared/validators/installment-vs-cash", () => ({
  getSuggestedSelectedOption: jest.fn(),
}));

const mockedUseSessionStore = jest.mocked(useSessionStore);
const mockedUseInstallmentVsCashDraftState = jest.mocked(
  useInstallmentVsCashDraftState,
);
const mockedUseSavedSimulationState = jest.mocked(useSavedSimulationState);
const mockedCreateInstallmentVsCashActions = jest.mocked(
  createInstallmentVsCashActions,
);
const mockedUseInstallmentVsCashHistoryQuery = jest.mocked(
  useInstallmentVsCashHistoryQuery,
);
const mockedUseEntitlementCheckQuery = jest.mocked(useEntitlementCheckQuery);
const mockedUseInstallmentVsCashCalculationMutation = jest.mocked(
  useInstallmentVsCashCalculationMutation,
);
const mockedUseSaveInstallmentVsCashMutation = jest.mocked(
  useSaveInstallmentVsCashMutation,
);
const mockedUseCreateGoalFromInstallmentVsCashMutation = jest.mocked(
  useCreateGoalFromInstallmentVsCashMutation,
);
const mockedUseCreatePlannedExpenseFromInstallmentVsCashMutation = jest.mocked(
  useCreatePlannedExpenseFromInstallmentVsCashMutation,
);
const mockedGetSuggestedSelectedOption = jest.mocked(getSuggestedSelectedOption);

describe("useInstallmentVsCashScreenController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseSessionStore.mockReturnValue(true);
    mockedUseInstallmentVsCashDraftState.mockReturnValue({
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
      setErrors: jest.fn(),
      setTextField: jest.fn(),
      setInstallmentMode: jest.fn(),
      setDelayPreset: jest.fn(),
      setOpportunityRateType: jest.fn(),
      setFeesEnabled: jest.fn(),
    });
    mockedUseInstallmentVsCashCalculationMutation.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    } as never);
    mockedUseSaveInstallmentVsCashMutation.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    } as never);
    mockedUseCreateGoalFromInstallmentVsCashMutation.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    } as never);
    mockedUseCreatePlannedExpenseFromInstallmentVsCashMutation.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    } as never);
    mockedUseInstallmentVsCashHistoryQuery.mockReturnValue({
      data: [],
      isPending: false,
    } as never);
    mockedUseEntitlementCheckQuery.mockReturnValue({
      data: true,
      isPending: false,
    } as never);
    mockedUseSavedSimulationState.mockReturnValue({
      savedSimulation: null,
      setSavedSimulation: jest.fn(),
      ensureSavedSimulation: jest.fn(),
    });
    mockedCreateInstallmentVsCashActions.mockReturnValue({
      handleCalculate: jest.fn().mockResolvedValue(undefined),
      handleSave: jest.fn().mockResolvedValue(undefined),
      handleCreateGoal: jest.fn().mockResolvedValue(undefined),
      handleCreatePlannedExpense: jest.fn().mockResolvedValue(undefined),
    });
  });

  it("agrega os submódulos do fluxo e navega ao voltar", () => {
    const useStateSpy = jest.spyOn(React, "useState");

    const { result } = renderHook(() => useInstallmentVsCashScreenController());

    act(() => {
      result.current.handleGoBack();
    });

    expect(mockedUseInstallmentVsCashHistoryQuery).toHaveBeenCalledWith(true);
    expect(mockedUseEntitlementCheckQuery).toHaveBeenCalledWith(
      "advanced_simulations",
      true,
    );
    expect(mockedCreateInstallmentVsCashActions).toHaveBeenCalled();
    expect(mockBack).toHaveBeenCalledTimes(1);

    useStateSpy.mockRestore();
  });
});
