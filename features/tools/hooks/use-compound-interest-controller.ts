import { useCallback, useMemo, useState } from "react";

import {
  calculateCompoundInterest,
  type CompoundInterestInputs,
  type CompoundInterestRegime,
  type CompoundInterestResult,
} from "@/features/tools/services/compound-interest-calculator";
import { useSaveSimulationMutation } from "@/features/tools/hooks/use-save-simulation-mutation";
import {
  useLeaveWithoutSavePrompt,
  type LeaveOutcome,
} from "@/features/tools/hooks/use-leave-without-save-prompt";

const COMPOUND_INTEREST_TOOL_ID = "compound-interest";
const COMPOUND_INTEREST_RULE_VERSION = "2026.04";

export interface CompoundInterestDraft {
  readonly initialAmount: string;
  readonly monthlyContribution: string;
  readonly annualRatePercent: string;
  readonly months: string;
  readonly regime: CompoundInterestRegime;
}

export interface CompoundInterestErrors {
  readonly initialAmount?: string;
  readonly monthlyContribution?: string;
  readonly annualRatePercent?: string;
  readonly months?: string;
}

const DEFAULT_DRAFT: CompoundInterestDraft = {
  initialAmount: "1000",
  monthlyContribution: "500",
  annualRatePercent: "12",
  months: "120",
  regime: "yearly",
};

const parseNumber = (raw: string): number => {
  const normalized = raw.replace(/\./g, "").replace(",", ".").trim();
  if (normalized.length === 0) {
    return Number.NaN;
  }
  return Number.parseFloat(normalized);
};

const validate = (draft: CompoundInterestDraft): CompoundInterestErrors => {
  const errors: CompoundInterestErrors = {};
  const initial = parseNumber(draft.initialAmount);
  if (!Number.isFinite(initial) || initial < 0) {
    Object.assign(errors, { initialAmount: "Informe um valor inicial válido." });
  }
  const contribution = parseNumber(draft.monthlyContribution);
  if (!Number.isFinite(contribution) || contribution < 0) {
    Object.assign(errors, {
      monthlyContribution: "Informe um aporte mensal válido (use 0 se não houver).",
    });
  }
  const rate = parseNumber(draft.annualRatePercent);
  if (!Number.isFinite(rate) || rate < 0) {
    Object.assign(errors, { annualRatePercent: "Informe uma taxa anual válida." });
  }
  const months = parseNumber(draft.months);
  if (!Number.isFinite(months) || months <= 0 || months > 720) {
    Object.assign(errors, { months: "Informe um prazo entre 1 e 720 meses." });
  }
  return errors;
};

const draftToInputs = (draft: CompoundInterestDraft): CompoundInterestInputs => ({
  initialAmount: parseNumber(draft.initialAmount),
  monthlyContribution: parseNumber(draft.monthlyContribution),
  annualRatePercent: parseNumber(draft.annualRatePercent),
  months: Math.round(parseNumber(draft.months)),
  regime: draft.regime,
});

const buildSaveCommand = (
  draft: CompoundInterestDraft,
  result: CompoundInterestResult,
) => {
  const inputs = draftToInputs(draft);
  return {
    toolId: COMPOUND_INTEREST_TOOL_ID,
    ruleVersion: COMPOUND_INTEREST_RULE_VERSION,
    inputs: { ...inputs },
    result: {
      finalAmount: result.finalAmount,
      totalContributed: result.totalContributed,
      totalInterest: result.totalInterest,
    },
    metadata: {
      label: `Juros compostos · ${inputs.months} meses · ${inputs.annualRatePercent}% a.a.`,
    },
  } as const;
};

export interface CompoundInterestController {
  readonly draft: CompoundInterestDraft;
  readonly errors: CompoundInterestErrors;
  readonly result: CompoundInterestResult | null;
  readonly savedSimulationId: string | null;
  readonly isSaving: boolean;
  readonly saveError: unknown | null;
  readonly hasUnsavedResult: boolean;
  readonly setField: <K extends keyof CompoundInterestDraft>(
    key: K,
    value: CompoundInterestDraft[K],
  ) => void;
  readonly handleCalculate: () => void;
  readonly handleReset: () => void;
  readonly handleSave: () => Promise<void>;
  readonly confirmLeave: () => Promise<LeaveOutcome>;
}

/**
 * Reactive controller backing the Juros Compostos screen. Owns the
 * draft form, validation, calculation, save and the leave-prompt
 * binding. The screen is a thin presenter on top of this hook.
 * @returns Reactive state + action handlers ready to render.
 */
export const useCompoundInterestController = (): CompoundInterestController => {
  const [draft, setDraft] = useState<CompoundInterestDraft>(DEFAULT_DRAFT);
  const [errors, setErrors] = useState<CompoundInterestErrors>({});
  const [result, setResult] = useState<CompoundInterestResult | null>(null);
  const [savedSimulationId, setSavedSimulationId] = useState<string | null>(null);
  const saveMutation = useSaveSimulationMutation();

  const hasUnsavedResult = result !== null && savedSimulationId === null;

  const setField = useCallback(
    <K extends keyof CompoundInterestDraft>(
      key: K,
      value: CompoundInterestDraft[K],
    ): void => {
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
    const computed = calculateCompoundInterest(draftToInputs(draft));
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
  return useMemo<CompoundInterestController>(
    () => buildController({
      draft, errors, result, savedSimulationId,
      isSaving: isPending, saveError, hasUnsavedResult,
      setField, handleCalculate, handleReset, handleSave, confirmLeave,
    }),
    [
      draft, errors, result, savedSimulationId, isPending, saveError,
      hasUnsavedResult, setField, handleCalculate, handleReset,
      handleSave, confirmLeave,
    ],
  );
};

const buildController = (
  parts: CompoundInterestController,
): CompoundInterestController => parts;
