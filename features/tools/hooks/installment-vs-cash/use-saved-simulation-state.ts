import { useCallback, useRef, useState, type Dispatch, type SetStateAction } from "react";

import type {
  InstallmentVsCashCalculation,
  InstallmentVsCashCalculationRequestDto,
  InstallmentVsCashSavedCalculation,
  InstallmentVsCashSavedSimulation,
} from "@/features/tools/contracts";
import { toInstallmentVsCashCalculationRequest, type InstallmentVsCashFormDraft } from "@/shared/validators/installment-vs-cash";

export interface SavedSimulationState {
  readonly savedSimulation: InstallmentVsCashSavedSimulation | null;
  readonly setSavedSimulation: Dispatch<
    SetStateAction<InstallmentVsCashSavedSimulation | null>
  >;
  readonly ensureSavedSimulation: () => Promise<InstallmentVsCashSavedSimulation>;
}

/**
 * Keeps the last saved simulation stable across premium follow-up actions.
 *
 * @param calculation Current calculation result.
 * @param draft Current form draft.
 * @param saveMutation Save mutation dependency.
 * @returns Saved simulation state plus lazy persistence helper.
 */
export const useSavedSimulationState = (
  calculation: InstallmentVsCashCalculation | null,
  draft: InstallmentVsCashFormDraft,
  saveMutation: {
    readonly mutateAsync: (
      payload: InstallmentVsCashCalculationRequestDto,
    ) => Promise<InstallmentVsCashSavedCalculation>;
  },
): SavedSimulationState => {
  const [savedSimulation, setSavedSimulation] =
    useState<InstallmentVsCashSavedSimulation | null>(null);
  const savedSimulationRef = useRef<InstallmentVsCashSavedSimulation | null>(null);
  const pendingSaveRef = useRef<Promise<InstallmentVsCashSavedSimulation> | null>(
    null,
  );

  const updateSavedSimulation = useCallback(
    (
      value:
        | InstallmentVsCashSavedSimulation
        | null
        | ((current: InstallmentVsCashSavedSimulation | null) => InstallmentVsCashSavedSimulation | null),
    ): void => {
      setSavedSimulation((current) => {
        const nextValue = typeof value === "function" ? value(current) : value;
        savedSimulationRef.current = nextValue;
        return nextValue;
      });
    },
    [],
  );

  const ensureSavedSimulation = async (): Promise<InstallmentVsCashSavedSimulation> => {
    if (savedSimulationRef.current !== null) {
      return savedSimulationRef.current;
    }

    if (pendingSaveRef.current !== null) {
      return pendingSaveRef.current;
    }

    if (calculation === null) {
      throw new Error("Calcule antes de salvar.");
    }

    pendingSaveRef.current = saveMutation
      .mutateAsync(toInstallmentVsCashCalculationRequest(draft))
      .then((response) => {
        updateSavedSimulation(response.simulation);
        return response.simulation;
      })
      .finally(() => {
        pendingSaveRef.current = null;
      });

    return pendingSaveRef.current;
  };

  return {
    savedSimulation,
    setSavedSimulation: updateSavedSimulation,
    ensureSavedSimulation,
  };
};
