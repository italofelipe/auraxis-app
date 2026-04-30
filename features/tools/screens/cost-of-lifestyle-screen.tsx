import { useCallback, useMemo, useState, type Dispatch, type ReactElement, type SetStateAction } from "react";

import { Paragraph, XStack, YStack } from "tamagui";
import { useRouter } from "expo-router";

import { AppButton } from "@/shared/components/app-button";
import { AppErrorNotice } from "@/shared/components/app-error-notice";
import { AppInputField } from "@/shared/components/app-input-field";
import { AppScreen } from "@/shared/components/app-screen";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";
import {
  CalculatorResultCard,
  type CalculatorMetric,
} from "@/features/tools/components/calculator-result-card";
import { useSaveSimulationMutation } from "@/features/tools/hooks/use-save-simulation-mutation";
import {
  calculateCustoEstiloVida,
  createDefaultCustoEstiloVidaFormState,
  createDefaultExpense,
  validateCustoEstiloVidaForm,
  type CustoEstiloVidaFormState,
  type CustoEstiloVidaResult,
  type RecurringExpense,
} from "@/features/tools/services/calculators/custo-estilo-vida";
import { resolveCalculatorError } from "@/features/tools/services/calculator-error-messages";
import { formatBrl } from "@/features/tools/services/calculator-formatters";

const TOOL_ID = "cost-of-lifestyle";
const RULE_VERSION = "2026.04";

const parseDecimal = (raw: string): number | null => {
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return null;
  }
  const normalized = trimmed.replace(/\./g, "").replace(",", ".");
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

const buildMetrics = (result: CustoEstiloVidaResult): readonly CalculatorMetric[] => [
  { label: "Custo mensal total", value: formatBrl(result.totalMonthlyCost) },
  { label: "Custo anual total", value: formatBrl(result.totalAnnualCost) },
  {
    label: `Custo de oportunidade em ${result.horizonYears}a`,
    value: formatBrl(result.totalOpportunityCost),
  },
  ...result.expenses.map((expense) => ({
    label: expense.name || "(sem nome)",
    value: formatBrl(expense.opportunityCost),
    hint: `${formatBrl(expense.monthlyAmount)}/mês`,
  })),
];

interface ExpenseRowProps {
  readonly index: number;
  readonly expense: RecurringExpense;
  readonly onChange: (index: number, expense: RecurringExpense) => void;
  readonly onRemove: (index: number) => void;
}

function ExpenseRow({ index, expense, onChange, onRemove }: ExpenseRowProps): ReactElement {
  return (
    <YStack gap="$2">
      <AppInputField
        id={`expense-name-${index}`}
        label={`Despesa ${index + 1} — descrição`}
        keyboardType="default"
        value={expense.name}
        onChangeText={(text) => onChange(index, { ...expense, name: text })}
        placeholder="Streaming, café, app..."
      />
      <AppInputField
        id={`expense-amount-${index}`}
        label="Valor mensal (R$)"
        keyboardType="decimal-pad"
        value={expense.monthlyAmount === 0 ? "" : String(expense.monthlyAmount)}
        onChangeText={(text) => onChange(index, { ...expense, monthlyAmount: parseDecimal(text) ?? 0 })}
        placeholder="0,00"
      />
      <XStack justifyContent="flex-end">
        <AppButton tone="secondary" onPress={() => onRemove(index)}>
          Remover
        </AppButton>
      </XStack>
    </YStack>
  );
}

interface CostFormProps {
  readonly draft: CustoEstiloVidaFormState;
  readonly errors: Readonly<Record<string, string | undefined>>;
  readonly onUpdateExpense: (index: number, expense: RecurringExpense) => void;
  readonly onAddExpense: () => void;
  readonly onRemoveExpense: (index: number) => void;
  readonly onParamChange: <K extends keyof CustoEstiloVidaFormState>(
    key: K,
    value: CustoEstiloVidaFormState[K],
  ) => void;
  readonly onSubmit: () => void;
  readonly onReset: () => void;
}

function CostForm(props: CostFormProps): ReactElement {
  const { draft, errors, onUpdateExpense, onAddExpense, onRemoveExpense, onParamChange, onSubmit, onReset } = props;
  return (
    <YStack gap="$3">
      {draft.expenses.map((expense, index) => (
        <ExpenseRow key={index} index={index} expense={expense} onChange={onUpdateExpense} onRemove={onRemoveExpense} />
      ))}
      {errors.expenses !== undefined ? (
        <Paragraph color="$danger" fontFamily="$body" fontSize="$2">
          {errors.expenses}
        </Paragraph>
      ) : null}
      <AppButton tone="secondary" onPress={onAddExpense}>
        Adicionar despesa
      </AppButton>
      <AppInputField
        id="field-annualReturnPct"
        label="Rentabilidade anual estimada (%)"
        keyboardType="decimal-pad"
        value={String(draft.annualReturnPct)}
        onChangeText={(text) => onParamChange("annualReturnPct", parseDecimal(text) ?? 0)}
        placeholder="12"
      />
      <AppInputField
        id="field-horizonYears"
        label="Horizonte (anos)"
        keyboardType="number-pad"
        value={String(draft.horizonYears)}
        onChangeText={(text) => {
          const parsed = Number.parseInt(text.trim(), 10);
          onParamChange("horizonYears", Number.isFinite(parsed) ? Math.max(1, parsed) : 1);
        }}
        errorText={errors.horizonYears}
        placeholder="10"
      />
      <XStack gap="$2">
        <AppButton tone="primary" onPress={onSubmit}>
          Calcular
        </AppButton>
        <AppButton tone="secondary" onPress={onReset}>
          Limpar
        </AppButton>
      </XStack>
    </YStack>
  );
}

interface CostControllerState {
  readonly draft: CustoEstiloVidaFormState;
  readonly errors: Readonly<Record<string, string | undefined>>;
  readonly result: CustoEstiloVidaResult | null;
  readonly savedId: string | null;
  readonly isSaving: boolean;
  readonly saveError: unknown;
  readonly onUpdateExpense: (index: number, expense: RecurringExpense) => void;
  readonly onAddExpense: () => void;
  readonly onRemoveExpense: (index: number) => void;
  readonly onParamChange: <K extends keyof CustoEstiloVidaFormState>(
    key: K,
    value: CustoEstiloVidaFormState[K],
  ) => void;
  readonly onSubmit: () => void;
  readonly onReset: () => void;
  readonly onSave: () => void;
}

const buildExpenseHandlers = (
  setDraft: Dispatch<SetStateAction<CustoEstiloVidaFormState>>,
  markDirty: () => void,
): {
  readonly onUpdateExpense: (index: number, expense: RecurringExpense) => void;
  readonly onAddExpense: () => void;
  readonly onRemoveExpense: (index: number) => void;
} => ({
  onUpdateExpense: (index, expense) => {
    setDraft((prev) => ({
      ...prev,
      expenses: prev.expenses.map((existing, i) => (i === index ? expense : existing)),
    }));
    markDirty();
  },
  onAddExpense: () => {
    setDraft((prev) => ({ ...prev, expenses: [...prev.expenses, createDefaultExpense()] }));
    markDirty();
  },
  onRemoveExpense: (index) => {
    setDraft((prev) => ({
      ...prev,
      expenses: prev.expenses.filter((_, i) => i !== index),
    }));
    markDirty();
  },
});

const useCostController = (): CostControllerState => {
  const [draft, setDraft] = useState<CustoEstiloVidaFormState>(createDefaultCustoEstiloVidaFormState);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [result, setResult] = useState<CustoEstiloVidaResult | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const saveMutation = useSaveSimulationMutation();

  const markDirty = useCallback((): void => {
    setSavedId(null);
  }, []);

  const expenseHandlers = useMemo(
    () => buildExpenseHandlers(setDraft, markDirty),
    [markDirty],
  );

  const onParamChange = useCallback(
    <K extends keyof CustoEstiloVidaFormState>(key: K, value: CustoEstiloVidaFormState[K]): void => {
      setDraft((prev) => ({ ...prev, [key]: value }));
      markDirty();
    },
    [markDirty],
  );

  const onSubmit = useCallback((): void => {
    const validationErrors = validateCustoEstiloVidaForm(draft);
    const next: Record<string, string | undefined> = {};
    for (const error of validationErrors) {
      next[error.field as string] = resolveCalculatorError(error.messageKey);
    }
    setErrors(next);
    if (validationErrors.length > 0) {
      setResult(null);
      return;
    }
    setResult(calculateCustoEstiloVida(draft));
    setSavedId(null);
  }, [draft]);

  const onReset = useCallback((): void => {
    setDraft(createDefaultCustoEstiloVidaFormState());
    setErrors({});
    setResult(null);
    setSavedId(null);
  }, []);

  const onSave = useCallback((): void => {
    if (result === null) {
      return;
    }
    void saveMutation
      .mutateAsync({
        toolId: TOOL_ID,
        ruleVersion: RULE_VERSION,
        inputs: { ...draft } as Record<string, unknown>,
        result: { ...result } as Record<string, unknown>,
        metadata: {
          label: `Estilo de vida · ${draft.expenses.length} despesas · ${draft.horizonYears}a`,
        },
      })
      .then((saved) => {
        setSavedId(saved.id);
      });
  }, [draft, result, saveMutation]);

  return {
    draft,
    errors,
    result,
    savedId,
    isSaving: saveMutation.isPending,
    saveError: saveMutation.error,
    ...expenseHandlers,
    onParamChange,
    onSubmit,
    onReset,
    onSave,
  };
};

interface HeaderProps {
  readonly onBack: () => void;
}

function Header({ onBack }: HeaderProps): ReactElement {
  return (
    <XStack justifyContent="space-between" alignItems="center">
      <YStack gap="$1" flex={1}>
        <Paragraph color="$color" fontFamily="$heading" fontSize="$7">
          Custo do estilo de vida
        </Paragraph>
        <Paragraph color="$muted" fontFamily="$body" fontSize="$3">
          Quanto cada despesa recorrente custa em juros compostos.
        </Paragraph>
      </YStack>
      <AppButton tone="secondary" onPress={onBack}>
        Voltar
      </AppButton>
    </XStack>
  );
}

export function CostOfLifestyleScreen(): ReactElement {
  const router = useRouter();
  const ctrl = useCostController();
  const computedMetrics = useMemo<readonly CalculatorMetric[]>(
    () => (ctrl.result === null ? [] : buildMetrics(ctrl.result)),
    [ctrl.result],
  );
  return (
    <AppScreen testID="cost-of-lifestyle-screen">
      <Header onBack={() => router.back()} />
      <AppSurfaceCard
        title="Liste suas despesas"
        description="Cada item recorrente reduz seu patrimônio futuro pelo custo de oportunidade."
      >
        <CostForm
          draft={ctrl.draft}
          errors={ctrl.errors}
          onUpdateExpense={ctrl.onUpdateExpense}
          onAddExpense={ctrl.onAddExpense}
          onRemoveExpense={ctrl.onRemoveExpense}
          onParamChange={ctrl.onParamChange}
          onSubmit={ctrl.onSubmit}
          onReset={ctrl.onReset}
        />
      </AppSurfaceCard>
      {ctrl.saveError !== null ? (
        <AppErrorNotice
          error={ctrl.saveError}
          fallbackTitle="Não foi possível salvar"
          fallbackDescription="Confira a conexão e tente novamente."
        />
      ) : null}
      {ctrl.result !== null ? (
        <CalculatorResultCard
          title="Custo de oportunidade"
          description="Cada item mostra quanto teria virado se investido na rentabilidade informada."
          metrics={computedMetrics}
          isSaving={ctrl.isSaving}
          isSaved={ctrl.savedId !== null}
          onSave={ctrl.onSave}
        />
      ) : null}
    </AppScreen>
  );
}
