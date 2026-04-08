import { useState, type Dispatch, type SetStateAction } from "react";

import {
  createDefaultInstallmentVsCashFormDraft,
  type InstallmentDelayPreset,
  type InstallmentInputMode,
  type InstallmentVsCashFormDraft,
  type InstallmentVsCashFormErrors,
} from "@/shared/validators/installment-vs-cash";
import type { OpportunityRateType } from "@/features/tools/contracts";

export type TextFieldName =
  | "scenarioLabel"
  | "cashPrice"
  | "installmentCount"
  | "installmentAmount"
  | "installmentTotal"
  | "customFirstPaymentDelayDays"
  | "opportunityRateAnnual"
  | "inflationRateAnnual"
  | "feesUpfront";

export interface InstallmentVsCashDraftState {
  readonly draft: InstallmentVsCashFormDraft;
  readonly errors: InstallmentVsCashFormErrors;
  readonly setErrors: Dispatch<SetStateAction<InstallmentVsCashFormErrors>>;
  readonly setTextField: (field: TextFieldName, value: string) => void;
  readonly setInstallmentMode: (value: InstallmentInputMode) => void;
  readonly setDelayPreset: (value: InstallmentDelayPreset) => void;
  readonly setOpportunityRateType: (value: OpportunityRateType) => void;
  readonly setFeesEnabled: (value: boolean) => void;
}

/**
 * Owns the local draft state for the installment-vs-cash flow.
 *
 * @returns Canonical draft setters and error state for the screen controller.
 */
export const useInstallmentVsCashDraftState =
(): InstallmentVsCashDraftState => {
  const [draft, setDraft] = useState<InstallmentVsCashFormDraft>(
    createDefaultInstallmentVsCashFormDraft(),
  );
  const [errors, setErrors] = useState<InstallmentVsCashFormErrors>({});

  const updateDraft = (
    updater: (current: InstallmentVsCashFormDraft) => InstallmentVsCashFormDraft,
  ): void => {
    setDraft(updater);
    setErrors((current) => ({ ...current, general: undefined }));
  };

  return {
    draft,
    errors,
    setErrors,
    setTextField: (field, value) => {
      updateDraft((current) => ({ ...current, [field]: value }));
      setErrors((current) => ({ ...current, [field]: undefined }));
    },
    setInstallmentMode: (value) => {
      updateDraft((current) => ({ ...current, installmentInputMode: value }));
    },
    setDelayPreset: (value) => {
      updateDraft((current) => ({ ...current, firstPaymentDelayPreset: value }));
    },
    setOpportunityRateType: (value) => {
      updateDraft((current) => ({ ...current, opportunityRateType: value }));
    },
    setFeesEnabled: (value) => {
      updateDraft((current) => ({ ...current, feesEnabled: value }));
    },
  };
};
