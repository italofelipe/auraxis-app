import { useCallback, useMemo, useState } from "react";

import {
  calculateCdbLciLca,
  type CdbLciLcaInputs,
  type CdbLciLcaRateKind,
  type CdbLciLcaResult,
} from "@/features/tools/services/cdb-lci-lca-calculator";
import { useSaveSimulationMutation } from "@/features/tools/hooks/use-save-simulation-mutation";
import {
  useLeaveWithoutSavePrompt,
  type LeaveOutcome,
} from "@/features/tools/hooks/use-leave-without-save-prompt";

const TOOL_ID = "cdb-lci-lca";
const RULE_VERSION = "2026.04";

export interface CdbLciLcaDraft {
  readonly amount: string;
  readonly months: string;
  readonly rateKind: CdbLciLcaRateKind;
  readonly rateValue: string;
  readonly cdiAnnualPercent: string;
}

export interface CdbLciLcaErrors {
  readonly amount?: string;
  readonly months?: string;
  readonly rateValue?: string;
  readonly cdiAnnualPercent?: string;
}

const DEFAULT_DRAFT: CdbLciLcaDraft = {
  amount: "10000",
  months: "12",
  rateKind: "cdi_percent",
  rateValue: "110",
  cdiAnnualPercent: "12",
};

const parseNumber = (raw: string): number => {
  const normalized = raw.replace(/\./g, "").replace(",", ".").trim();
  if (normalized.length === 0) {
    return Number.NaN;
  }
  return Number.parseFloat(normalized);
};

const validate = (draft: CdbLciLcaDraft): CdbLciLcaErrors => {
  const errors: CdbLciLcaErrors = {};
  const amount = parseNumber(draft.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    Object.assign(errors, { amount: "Informe um valor maior que zero." });
  }
  const months = parseNumber(draft.months);
  if (!Number.isFinite(months) || months <= 0 || months > 360) {
    Object.assign(errors, { months: "Informe um prazo entre 1 e 360 meses." });
  }
  const rate = parseNumber(draft.rateValue);
  if (!Number.isFinite(rate) || rate <= 0) {
    Object.assign(errors, { rateValue: "Informe uma taxa maior que zero." });
  }
  if (draft.rateKind === "cdi_percent") {
    const cdi = parseNumber(draft.cdiAnnualPercent);
    if (!Number.isFinite(cdi) || cdi <= 0) {
      Object.assign(errors, { cdiAnnualPercent: "Informe o CDI anual atual." });
    }
  }
  return errors;
};

const draftToInputs = (draft: CdbLciLcaDraft): CdbLciLcaInputs => ({
  amount: parseNumber(draft.amount),
  months: Math.round(parseNumber(draft.months)),
  rateKind: draft.rateKind,
  rateValue: parseNumber(draft.rateValue),
  cdiAnnualPercent: parseNumber(draft.cdiAnnualPercent),
});

const buildSaveCommand = (
  draft: CdbLciLcaDraft,
  result: CdbLciLcaResult,
) => {
  const inputs = draftToInputs(draft);
  const rateSuffix =
    inputs.rateKind === "cdi_percent" ? "% CDI" : "% a.a.";
  return {
    toolId: TOOL_ID,
    ruleVersion: RULE_VERSION,
    inputs: { ...inputs },
    result: {
      bestProduct: result.bestProduct,
      cdb: { ...result.cdb },
      lci: { ...result.lci },
      lca: { ...result.lca },
    },
    metadata: {
      label: `CDB · LCI · LCA · ${inputs.months} meses · ${inputs.rateValue}${rateSuffix}`,
    },
  } as const;
};

export interface CdbLciLcaController {
  readonly draft: CdbLciLcaDraft;
  readonly errors: CdbLciLcaErrors;
  readonly result: CdbLciLcaResult | null;
  readonly savedSimulationId: string | null;
  readonly isSaving: boolean;
  readonly saveError: unknown | null;
  readonly hasUnsavedResult: boolean;
  readonly setField: <K extends keyof CdbLciLcaDraft>(
    key: K,
    value: CdbLciLcaDraft[K],
  ) => void;
  readonly handleCalculate: () => void;
  readonly handleReset: () => void;
  readonly handleSave: () => Promise<void>;
  readonly confirmLeave: () => Promise<LeaveOutcome>;
}

/**
 * Reactive controller for the CDB / LCI / LCA comparator screen.
 * @returns Reactive state + action handlers for the screen.
 */
export const useCdbLciLcaController = (): CdbLciLcaController => {
  const [draft, setDraft] = useState<CdbLciLcaDraft>(DEFAULT_DRAFT);
  const [errors, setErrors] = useState<CdbLciLcaErrors>({});
  const [result, setResult] = useState<CdbLciLcaResult | null>(null);
  const [savedSimulationId, setSavedSimulationId] = useState<string | null>(null);
  const saveMutation = useSaveSimulationMutation();

  const hasUnsavedResult = result !== null && savedSimulationId === null;

  const setField = useCallback(
    <K extends keyof CdbLciLcaDraft>(key: K, value: CdbLciLcaDraft[K]): void => {
      setDraft((prev) => ({ ...prev, [key]: value }));
      setSavedSimulationId(null);
    },
    [],
  );

  const handleCalculate = useCallback((): void => {
    const next = validate(draft);
    setErrors(next);
    if (Object.keys(next).length > 0) {
      return;
    }
    const computed = calculateCdbLciLca(draftToInputs(draft));
    setResult(computed);
    setSavedSimulationId(null);
  }, [draft]);

  const handleReset = useCallback((): void => {
    setDraft(DEFAULT_DRAFT);
    setResult(null);
    setSavedSimulationId(null);
    setErrors({});
  }, []);

  const handleSave = useCallback(async (): Promise<void> => {
    if (result === null) {
      return;
    }
    const saved = await saveMutation.mutateAsync(
      buildSaveCommand(draft, result),
    );
    setSavedSimulationId(saved.id);
  }, [draft, result, saveMutation]);

  const { isSaving, saveError, confirmLeave } = useLeaveWithoutSavePrompt({
    isDirty: hasUnsavedResult,
    onSave: handleSave,
    onDiscard: () => {
      setResult(null);
      setSavedSimulationId(null);
    },
  });

  const isPending = isSaving || saveMutation.isPending;
  return useMemo<CdbLciLcaController>(
    () => buildController({
      draft, errors, result, savedSimulationId,
      isSaving: isPending, saveError, hasUnsavedResult,
      setField, handleCalculate, handleReset, handleSave, confirmLeave,
    }),
    [
      draft,
      errors,
      result,
      savedSimulationId,
      isPending,
      saveError,
      hasUnsavedResult,
      setField,
      handleCalculate,
      handleReset,
      handleSave,
      confirmLeave,
    ],
  );
};

const buildController = (
  parts: CdbLciLcaController,
): CdbLciLcaController => parts;
