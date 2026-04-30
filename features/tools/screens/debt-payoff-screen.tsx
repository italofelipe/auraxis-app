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
  calculateQuitacaoDividas,
  createDefaultDebtEntry,
  createDefaultQuitacaoDividasFormState,
  validateQuitacaoDividasForm,
  type DebtEntry,
  type QuitacaoDividasFormState,
  type QuitacaoDividasResult,
} from "@/features/tools/services/calculators/quitacao-dividas";
import { resolveCalculatorError } from "@/features/tools/services/calculator-error-messages";
import { formatBrl } from "@/features/tools/services/calculator-formatters";

const TOOL_ID = "debt-payoff";
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

const buildMetrics = (result: QuitacaoDividasResult): readonly CalculatorMetric[] => [
  { label: "Dívida total", value: formatBrl(result.totalDebt) },
  { label: "Melhor estratégia", value: result.bestStrategy === "snowball" ? "Bola de neve" : "Avalanche" },
  {
    label: "Bola de neve — meses",
    value: `${result.snowball.totalMonths} meses`,
    hint: formatBrl(result.snowball.totalInterest) + " em juros",
  },
  {
    label: "Avalanche — meses",
    value: `${result.avalanche.totalMonths} meses`,
    hint: formatBrl(result.avalanche.totalInterest) + " em juros",
  },
  { label: "Juros economizados", value: formatBrl(result.interestSaved) },
  { label: "Meses economizados", value: `${result.monthsSaved} meses` },
];

interface DebtRowProps {
  readonly index: number;
  readonly debt: DebtEntry;
  readonly onChange: (index: number, debt: DebtEntry) => void;
  readonly onRemove: (index: number) => void;
}

function DebtRow({ index, debt, onChange, onRemove }: DebtRowProps): ReactElement {
  return (
    <YStack gap="$2">
      <AppInputField
        id={`debt-name-${index}`}
        label={`Dívida ${index + 1} — nome`}
        keyboardType="default"
        value={debt.name}
        onChangeText={(text) => onChange(index, { ...debt, name: text })}
        placeholder="Cartão, empréstimo..."
      />
      <AppInputField
        id={`debt-balance-${index}`}
        label="Saldo devedor (R$)"
        keyboardType="decimal-pad"
        value={debt.balance === 0 ? "" : String(debt.balance)}
        onChangeText={(text) => onChange(index, { ...debt, balance: parseDecimal(text) ?? 0 })}
        placeholder="0,00"
      />
      <AppInputField
        id={`debt-rate-${index}`}
        label="Taxa mensal (%)"
        keyboardType="decimal-pad"
        value={debt.monthlyRatePct === 0 ? "" : String(debt.monthlyRatePct)}
        onChangeText={(text) => onChange(index, { ...debt, monthlyRatePct: parseDecimal(text) ?? 0 })}
        placeholder="3,5"
      />
      <AppInputField
        id={`debt-min-${index}`}
        label="Pagamento mínimo (R$)"
        keyboardType="decimal-pad"
        value={debt.minimumPayment === 0 ? "" : String(debt.minimumPayment)}
        onChangeText={(text) => onChange(index, { ...debt, minimumPayment: parseDecimal(text) ?? 0 })}
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

interface DebtFormProps {
  readonly draft: QuitacaoDividasFormState;
  readonly errors: Readonly<Record<string, string | undefined>>;
  readonly onUpdateDebt: (index: number, debt: DebtEntry) => void;
  readonly onAddDebt: () => void;
  readonly onRemoveDebt: (index: number) => void;
  readonly onExtraChange: (value: number) => void;
  readonly onSubmit: () => void;
  readonly onReset: () => void;
}

function DebtForm(props: DebtFormProps): ReactElement {
  const { draft, errors, onUpdateDebt, onAddDebt, onRemoveDebt, onExtraChange, onSubmit, onReset } = props;
  return (
    <YStack gap="$3">
      {draft.debts.map((debt, index) => (
        <DebtRow key={index} index={index} debt={debt} onChange={onUpdateDebt} onRemove={onRemoveDebt} />
      ))}
      {errors.debts !== undefined ? (
        <Paragraph color="$danger" fontFamily="$body" fontSize="$2">
          {errors.debts}
        </Paragraph>
      ) : null}
      <AppButton tone="secondary" onPress={onAddDebt}>
        Adicionar dívida
      </AppButton>
      <AppInputField
        id="field-extra"
        label="Aporte extra mensal (R$)"
        keyboardType="decimal-pad"
        value={draft.extraPayment === 0 ? "" : String(draft.extraPayment)}
        onChangeText={(text) => onExtraChange(parseDecimal(text) ?? 0)}
        placeholder="0,00"
      />
      <Paragraph color="$muted" fontFamily="$body" fontSize="$2">
        Quanto sobra do orçamento para acelerar a quitação além dos mínimos.
      </Paragraph>
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

interface DebtControllerState {
  readonly draft: QuitacaoDividasFormState;
  readonly errors: Readonly<Record<string, string | undefined>>;
  readonly result: QuitacaoDividasResult | null;
  readonly savedId: string | null;
  readonly isSaving: boolean;
  readonly saveError: unknown;
  readonly onUpdateDebt: (index: number, debt: DebtEntry) => void;
  readonly onAddDebt: () => void;
  readonly onRemoveDebt: (index: number) => void;
  readonly onExtraChange: (value: number) => void;
  readonly onSubmit: () => void;
  readonly onReset: () => void;
  readonly onSave: () => void;
}

const buildDebtHandlers = (
  setDraft: Dispatch<SetStateAction<QuitacaoDividasFormState>>,
  markDirty: () => void,
): {
  readonly onUpdateDebt: (index: number, debt: DebtEntry) => void;
  readonly onAddDebt: () => void;
  readonly onRemoveDebt: (index: number) => void;
  readonly onExtraChange: (value: number) => void;
} => ({
  onUpdateDebt: (index, debt) => {
    setDraft((prev) => ({
      ...prev,
      debts: prev.debts.map((existing, i) => (i === index ? debt : existing)),
    }));
    markDirty();
  },
  onAddDebt: () => {
    setDraft((prev) => ({ ...prev, debts: [...prev.debts, createDefaultDebtEntry()] }));
    markDirty();
  },
  onRemoveDebt: (index) => {
    setDraft((prev) => ({ ...prev, debts: prev.debts.filter((_, i) => i !== index) }));
    markDirty();
  },
  onExtraChange: (value) => {
    setDraft((prev) => ({ ...prev, extraPayment: value }));
    markDirty();
  },
});

const useDebtController = (): DebtControllerState => {
  const [draft, setDraft] = useState<QuitacaoDividasFormState>(createDefaultQuitacaoDividasFormState);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [result, setResult] = useState<QuitacaoDividasResult | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const saveMutation = useSaveSimulationMutation();

  const markDirty = useCallback((): void => {
    setSavedId(null);
  }, []);

  const debtHandlers = useMemo(
    () => buildDebtHandlers(setDraft, markDirty),
    [markDirty],
  );

  const onSubmit = useCallback((): void => {
    const validationErrors = validateQuitacaoDividasForm(draft);
    const next: Record<string, string | undefined> = {};
    for (const error of validationErrors) {
      next[error.field as string] = resolveCalculatorError(error.messageKey);
    }
    setErrors(next);
    if (validationErrors.length > 0) {
      setResult(null);
      return;
    }
    setResult(calculateQuitacaoDividas(draft));
    setSavedId(null);
  }, [draft]);

  const onReset = useCallback((): void => {
    setDraft(createDefaultQuitacaoDividasFormState());
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
          label: `Quitação · ${draft.debts.length} dívidas · ${formatBrl(result.totalDebt)}`,
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
    ...debtHandlers,
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
          Quitação de dívidas
        </Paragraph>
        <Paragraph color="$muted" fontFamily="$body" fontSize="$3">
          Bola de neve vs avalanche — qual estratégia te tira do vermelho mais rápido.
        </Paragraph>
      </YStack>
      <AppButton tone="secondary" onPress={onBack}>
        Voltar
      </AppButton>
    </XStack>
  );
}

export function DebtPayoffScreen(): ReactElement {
  const router = useRouter();
  const ctrl = useDebtController();
  const computedMetrics = useMemo<readonly CalculatorMetric[]>(
    () => (ctrl.result === null ? [] : buildMetrics(ctrl.result)),
    [ctrl.result],
  );
  return (
    <AppScreen testID="debt-payoff-screen">
      <Header onBack={() => router.back()} />
      <AppSurfaceCard
        title="Liste suas dívidas"
        description="Para cada uma, informe saldo, taxa mensal e mínimo."
      >
        <DebtForm
          draft={ctrl.draft}
          errors={ctrl.errors}
          onUpdateDebt={ctrl.onUpdateDebt}
          onAddDebt={ctrl.onAddDebt}
          onRemoveDebt={ctrl.onRemoveDebt}
          onExtraChange={ctrl.onExtraChange}
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
          title="Comparativo de estratégias"
          description="Bola de neve: liquida menores primeiro (motivacional). Avalanche: liquida juros maiores primeiro (mais econômico)."
          metrics={computedMetrics}
          isSaving={ctrl.isSaving}
          isSaved={ctrl.savedId !== null}
          onSave={ctrl.onSave}
        />
      ) : null}
    </AppScreen>
  );
}
