import { useCallback, useMemo, useState } from "react";

import { useSaveSimulationMutation } from "@/features/tools/hooks/use-save-simulation-mutation";
import {
  useLeaveWithoutSavePrompt,
  type LeaveOutcome,
} from "@/features/tools/hooks/use-leave-without-save-prompt";

/**
 * Generic spec describing a calculator's contract with the controller.
 * Each calculator screen passes one of these to {@link useCalculatorController}.
 *
 * @template TForm   Draft form state owned by the screen (Record-shaped).
 * @template TResult Computed result shape returned by the pure calculator.
 */
export interface CalculatorSpec<
  TForm extends Record<string, unknown>,
  TResult extends object,
> {
  /** Canonical tool_id from TOOLS_REGISTRY. */
  readonly toolId: string;
  /** Formula version persisted alongside each saved simulation. */
  readonly ruleVersion: string;
  /** Returns the initial form state. */
  readonly createDefault: () => TForm;
  /** Returns one error per invalid field; empty array means valid. */
  readonly validate: (form: TForm) => readonly { field: keyof TForm; message: string }[];
  /** Pure calculation given a validated form. */
  readonly calculate: (form: TForm) => TResult;
  /** Builds the metadata.label persisted with the simulation. */
  readonly buildMetadataLabel: (form: TForm, result: TResult) => string;
}

export type CalculatorErrors = Readonly<Record<string, string | undefined>>;

export interface CalculatorController<
  TForm extends Record<string, unknown>,
  TResult extends object,
> {
  readonly draft: TForm;
  readonly errors: Readonly<Record<string, string | undefined>>;
  readonly result: TResult | null;
  readonly savedSimulationId: string | null;
  readonly isSaving: boolean;
  readonly saveError: unknown | null;
  readonly hasUnsavedResult: boolean;
  readonly setField: <K extends keyof TForm>(key: K, value: TForm[K]) => void;
  readonly handleCalculate: () => void;
  readonly handleReset: () => void;
  readonly handleSave: () => Promise<void>;
  readonly confirmLeave: () => Promise<LeaveOutcome>;
}

const buildSavePayload = <TForm extends Record<string, unknown>, TResult extends object>(
  spec: CalculatorSpec<TForm, TResult>,
  draft: TForm,
  result: TResult,
) => ({
  toolId: spec.toolId,
  ruleVersion: spec.ruleVersion,
  inputs: { ...draft } as Record<string, unknown>,
  result: { ...result } as Record<string, unknown>,
  metadata: { label: spec.buildMetadataLabel(draft, result) },
});

const errorsToRecord = <TForm extends Record<string, unknown>>(
  list: readonly { field: keyof TForm; message: string }[],
): Record<string, string | undefined> => {
  const out: Record<string, string | undefined> = {};
  for (const entry of list) {
    out[String(entry.field)] = entry.message;
  }
  return out;
};

/**
 * Factory hook that wires any calculator-style tool screen to the canonical
 * save flow + leave-without-save prompt. The screen only owns the spec and
 * the visual form/result; everything reactive lives here.
 *
 * @param spec Calculator descriptor.
 * @returns Reactive state + action handlers ready for the screen.
 */
export function useCalculatorController<
  TForm extends Record<string, unknown>,
  TResult extends object,
>(spec: CalculatorSpec<TForm, TResult>): CalculatorController<TForm, TResult> {
  const [draft, setDraft] = useState<TForm>(() => spec.createDefault());
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [result, setResult] = useState<TResult | null>(null);
  const [savedSimulationId, setSavedSimulationId] = useState<string | null>(null);
  const saveMutation = useSaveSimulationMutation();

  const hasUnsavedResult = result !== null && savedSimulationId === null;

  const setField = useCallback(
    <K extends keyof TForm>(key: K, value: TForm[K]): void => {
      setDraft((prev) => ({ ...prev, [key]: value }));
      setSavedSimulationId(null);
    },
    [],
  );

  const handleCalculate = useCallback((): void => {
    const list = spec.validate(draft);
    setErrors(errorsToRecord(list));
    if (list.length > 0) {
      return;
    }
    setResult(spec.calculate(draft));
    setSavedSimulationId(null);
  }, [draft, spec]);

  const handleReset = useCallback((): void => {
    setDraft(spec.createDefault());
    setResult(null);
    setSavedSimulationId(null);
    setErrors({});
  }, [spec]);

  const handleSave = useCallback(async (): Promise<void> => {
    if (result === null) {
      return;
    }
    const saved = await saveMutation.mutateAsync(buildSavePayload(spec, draft, result));
    setSavedSimulationId(saved.id);
  }, [draft, result, saveMutation, spec]);

  const { isSaving, saveError, confirmLeave } = useLeaveWithoutSavePrompt({
    isDirty: hasUnsavedResult,
    onSave: handleSave,
    onDiscard: () => {
      setResult(null);
      setSavedSimulationId(null);
    },
  });

  const isPending = isSaving || saveMutation.isPending;
  return useMemo<CalculatorController<TForm, TResult>>(
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
}

const buildController = <TForm extends Record<string, unknown>, TResult extends object>(
  parts: CalculatorController<TForm, TResult>,
): CalculatorController<TForm, TResult> => parts;
