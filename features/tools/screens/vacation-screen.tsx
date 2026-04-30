import { useCallback, useMemo, useState, type ReactElement } from "react";

import { Paragraph, XStack, YStack } from "tamagui";
import { useRouter } from "expo-router";

import { AppButton } from "@/shared/components/app-button";
import { AppErrorNotice } from "@/shared/components/app-error-notice";
import { AppInputField } from "@/shared/components/app-input-field";
import { AppScreen } from "@/shared/components/app-screen";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";
import { AppToggleRow } from "@/shared/components/app-toggle-row";
import {
  CalculatorResultCard,
  type CalculatorMetric,
} from "@/features/tools/components/calculator-result-card";
import { useSaveSimulationMutation } from "@/features/tools/hooks/use-save-simulation-mutation";
import {
  VACATION_DAYS_OPTIONS,
  calculateFerias,
  createDefaultFeriasFormState,
  validateFeriasForm,
  type FeriasFormState,
  type FeriasResult,
  type VacationDaysOption,
} from "@/features/tools/services/calculators/ferias";
import { resolveCalculatorError } from "@/features/tools/services/calculator-error-messages";
import {
  formatBrl,
  formatPercent,
} from "@/features/tools/services/calculator-formatters";

const TOOL_ID = "vacation";
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

const isVacationDays = (value: number): value is VacationDaysOption =>
  (VACATION_DAYS_OPTIONS as readonly number[]).includes(value);

const buildMetrics = (result: FeriasResult): readonly CalculatorMetric[] => [
  { label: "Total bruto", value: formatBrl(result.totalGross) },
  { label: "Férias bruto", value: formatBrl(result.vacationGross) },
  { label: "1/3 constitucional", value: formatBrl(result.constitutionalThird) },
  ...(result.abonoEnabled ? [{ label: "Abono pecuniário", value: formatBrl(result.abonoValue) }] : []),
  { label: "INSS", value: formatBrl(result.inss) },
  { label: "IRRF", value: formatBrl(result.irrf) },
  { label: "Líquido a receber", value: formatBrl(result.netTotal) },
  { label: "Carga total", value: formatPercent(result.effectiveRate) },
];

interface VacationFormProps {
  readonly draft: FeriasFormState;
  readonly errors: Readonly<Record<string, string | undefined>>;
  readonly onFieldChange: <K extends keyof FeriasFormState>(key: K, value: FeriasFormState[K]) => void;
  readonly onSubmit: () => void;
  readonly onReset: () => void;
}

function VacationForm(props: VacationFormProps): ReactElement {
  const { draft, errors, onFieldChange, onSubmit, onReset } = props;
  return (
    <YStack gap="$3">
      <AppInputField
        id="field-grossSalary"
        label="Salário bruto mensal (R$)"
        keyboardType="decimal-pad"
        value={draft.grossSalary === null ? "" : String(draft.grossSalary)}
        onChangeText={(text) => onFieldChange("grossSalary", parseDecimal(text))}
        errorText={errors.grossSalary}
        placeholder=""
      />
      <AppInputField
        id="field-vacationDays"
        label="Dias de descanso"
        keyboardType="number-pad"
        value={String(draft.vacationDays)}
        onChangeText={(text) => {
          const parsed = Number.parseInt(text.trim(), 10);
          if (Number.isFinite(parsed) && isVacationDays(parsed)) {
            onFieldChange("vacationDays", parsed);
          }
        }}
        errorText={errors.vacationDays}
        placeholder="30"
      />
      <Paragraph color="$muted" fontFamily="$body" fontSize="$2">
        Use {VACATION_DAYS_OPTIONS.join(", ")}. Valores fora dessa lista são ignorados.
      </Paragraph>
      <AppToggleRow
        label="Vender 10 dias (abono pecuniário)"
        description="Disponível só com 20 ou 30 dias de descanso."
        checked={draft.abonoEnabled}
        onCheckedChange={(checked) => onFieldChange("abonoEnabled", checked)}
      />
      <AppInputField
        id="field-overtimeAverage"
        label="Média de horas extras (R$)"
        keyboardType="decimal-pad"
        value={String(draft.overtimeAverage)}
        onChangeText={(text) => onFieldChange("overtimeAverage", parseDecimal(text) ?? 0)}
        errorText={errors.overtimeAverage}
        placeholder="0"
      />
      <AppInputField
        id="field-dependents"
        label="Dependentes IRRF"
        keyboardType="number-pad"
        value={String(draft.dependents)}
        onChangeText={(text) => {
          const parsed = Number.parseInt(text.trim(), 10);
          onFieldChange("dependents", Number.isFinite(parsed) ? Math.max(0, parsed) : 0);
        }}
        errorText={errors.dependents}
        placeholder="0"
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

interface VacationControllerState {
  readonly draft: FeriasFormState;
  readonly errors: Readonly<Record<string, string | undefined>>;
  readonly result: FeriasResult | null;
  readonly savedId: string | null;
  readonly isSaving: boolean;
  readonly saveError: unknown;
  readonly onFieldChange: <K extends keyof FeriasFormState>(key: K, value: FeriasFormState[K]) => void;
  readonly onSubmit: () => void;
  readonly onReset: () => void;
  readonly onSave: () => void;
}

const useVacationController = (): VacationControllerState => {
  const [draft, setDraft] = useState<FeriasFormState>(createDefaultFeriasFormState);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [result, setResult] = useState<FeriasResult | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const saveMutation = useSaveSimulationMutation();

  const onFieldChange = useCallback(
    <K extends keyof FeriasFormState>(key: K, value: FeriasFormState[K]): void => {
      setDraft((prev) => ({ ...prev, [key]: value }));
      setSavedId(null);
    },
    [],
  );

  const onSubmit = useCallback((): void => {
    const validationErrors = validateFeriasForm(draft);
    const next: Record<string, string | undefined> = {};
    for (const error of validationErrors) {
      next[error.field as string] = resolveCalculatorError(error.messageKey);
    }
    setErrors(next);
    if (validationErrors.length > 0) {
      setResult(null);
      return;
    }
    setResult(calculateFerias(draft));
    setSavedId(null);
  }, [draft]);

  const onReset = useCallback((): void => {
    setDraft(createDefaultFeriasFormState());
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
          label: `Férias ${draft.vacationDays}d · ${formatBrl(draft.grossSalary ?? 0)}/mês`,
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
    onFieldChange,
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
          Férias
        </Paragraph>
        <Paragraph color="$muted" fontFamily="$body" fontSize="$3">
          Líquido a receber com abono opcional, INSS e IRRF.
        </Paragraph>
      </YStack>
      <AppButton tone="secondary" onPress={onBack}>
        Voltar
      </AppButton>
    </XStack>
  );
}

const metrics = (result: FeriasResult | null): readonly CalculatorMetric[] =>
  result === null ? [] : buildMetrics(result);

export function VacationScreen(): ReactElement {
  const router = useRouter();
  const ctrl = useVacationController();
  const computedMetrics = useMemo(() => metrics(ctrl.result), [ctrl.result]);
  return (
    <AppScreen testID="vacation-screen">
      <Header onBack={() => router.back()} />
      <AppSurfaceCard
        title="Configure as férias"
        description="Tabelas INSS / IRRF de 2025. Abono pecuniário só com 20 ou 30 dias de descanso."
      >
        <VacationForm
          draft={ctrl.draft}
          errors={ctrl.errors}
          onFieldChange={ctrl.onFieldChange}
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
          title="Resultado das férias"
          description="O 1/3 constitucional já está somado ao bruto."
          metrics={computedMetrics}
          isSaving={ctrl.isSaving}
          isSaved={ctrl.savedId !== null}
          onSave={ctrl.onSave}
        />
      ) : null}
    </AppScreen>
  );
}
