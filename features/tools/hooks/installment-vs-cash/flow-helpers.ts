import { Alert } from "react-native";

import type {
  CreateInstallmentVsCashGoalPayload,
  CreateInstallmentVsCashPlannedExpensePayload,
  InstallmentVsCashCalculation,
  SelectedPaymentOption,
} from "@/features/tools/contracts";
import type { InstallmentVsCashFormDraft } from "@/shared/validators/installment-vs-cash";

export const addDaysToToday = (
  days: number,
  now: Date = new Date(),
): string => {
  const baseDate = new Date(now);
  baseDate.setUTCDate(baseDate.getUTCDate() + days);
  return baseDate.toISOString().slice(0, 10);
};

export const showInstallmentVsCashErrorAlert = (
  title: string,
  error: unknown,
  showAlert: typeof Alert.alert = Alert.alert,
): void => {
  showAlert(
    title,
    error instanceof Error ? error.message : "Tente novamente em instantes.",
  );
};

export const ensureInstallmentVsCashPremiumAccess = (
  enabled: boolean,
  message: string,
  showAlert: typeof Alert.alert = Alert.alert,
): boolean => {
  if (enabled) {
    return true;
  }

  showAlert("Recurso Premium", message);
  return false;
};

export const buildInstallmentVsCashGoalPayload = (
  draft: InstallmentVsCashFormDraft,
  calculation: InstallmentVsCashCalculation | null,
  selectedOption: SelectedPaymentOption,
): CreateInstallmentVsCashGoalPayload => ({
  title: draft.scenarioLabel.trim() || "Compra planejada",
  selectedOption,
  description: calculation?.result.recommendationReason,
  priority: 3,
  currentAmount: 0,
});

export const buildInstallmentVsCashPlannedExpensePayload = (
  draft: InstallmentVsCashFormDraft,
  calculation: InstallmentVsCashCalculation | null,
  selectedOption: SelectedPaymentOption,
): CreateInstallmentVsCashPlannedExpensePayload => {
  const delayDays =
    selectedOption === "installment"
      ? calculation?.input.firstPaymentDelayDays ?? 0
      : 0;

  return {
    title: draft.scenarioLabel.trim() || "Compra planejada",
    selectedOption,
    description: calculation?.result.recommendationReason,
    dueDate: selectedOption === "cash" ? addDaysToToday(0) : undefined,
    firstDueDate:
      selectedOption === "installment" ? addDaysToToday(delayDays) : undefined,
    upfrontDueDate:
      selectedOption === "installment" && calculation?.input.feesUpfront
        ? addDaysToToday(0)
        : undefined,
  };
};
