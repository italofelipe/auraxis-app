import {
  useCallback,
  useMemo,
  useState,
  type Dispatch,
  type ReactElement,
  type SetStateAction,
} from "react";

import { useRouter } from "expo-router";
import { Paragraph, XStack, YStack } from "tamagui";

import {
  CalculatorResultCard,
  type CalculatorMetric,
} from "@/features/tools/components/calculator-result-card";
import { useSaveSimulationMutation } from "@/features/tools/hooks/use-save-simulation-mutation";
import { resolveCalculatorError } from "@/features/tools/services/calculator-error-messages";
import { formatBrl } from "@/features/tools/services/calculator-formatters";
import {
  DESCONTO_MARKUP_MODE_META,
  calculateDescontoMarkup,
  createDefaultDescontoMarkupFormState,
  validateDescontoMarkupForm,
  type DescontoMarkupFormState,
  type DescontoMarkupMode,
  type DescontoMarkupResult,
} from "@/features/tools/services/calculators/desconto-markup";
import { AppButton } from "@/shared/components/app-button";
import { AppErrorNotice } from "@/shared/components/app-error-notice";
import { AppInputField } from "@/shared/components/app-input-field";
import { AppScreen } from "@/shared/components/app-screen";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";

const TOOL_ID = "desconto-markup";
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

const metricsByMode: Readonly<
  Record<DescontoMarkupMode, (result: DescontoMarkupResult) => readonly CalculatorMetric[]>
> = {
  desconto: (result) => [
    { label: "Preco final", value: formatBrl(result.calculatedValue) },
    { label: "Economia", value: formatBrl(result.savingsOrProfit) },
    { label: "Desconto aplicado", value: `${result.pctResult.toFixed(2)}%` },
  ],
  markup: (result) => [
    { label: "Preco de venda", value: formatBrl(result.calculatedValue) },
    { label: "Lucro", value: formatBrl(result.savingsOrProfit) },
    { label: "Markup", value: `${result.pctResult.toFixed(2)}%` },
  ],
  margem: (result) => [
    { label: "Margem", value: `${result.calculatedValue.toFixed(2)}%` },
    { label: "Lucro", value: formatBrl(result.savingsOrProfit) },
  ],
  reverso: (result) => [
    { label: "Preco original", value: formatBrl(result.calculatedValue) },
    { label: "Desconto recuperado", value: formatBrl(result.savingsOrProfit) },
    { label: "Desconto aplicado", value: `${result.pctResult.toFixed(2)}%` },
  ],
};

const buildMetrics = (
  result: DescontoMarkupResult,
): readonly CalculatorMetric[] => metricsByMode[result.mode](result);

interface ModeToggleProps {
  readonly selected: DescontoMarkupMode;
  readonly onSelect: (mode: DescontoMarkupMode) => void;
}

function ModeToggle({ selected, onSelect }: ModeToggleProps): ReactElement {
  return (
    <YStack gap="$2">
      <XStack gap="$2" flexWrap="wrap" testID="desconto-markup-mode-toggle">
        {DESCONTO_MARKUP_MODE_META.map((mode) => (
          <AppButton
            key={mode.id}
            tone={mode.id === selected ? "primary" : "secondary"}
            onPress={() => onSelect(mode.id)}
            testID={`desconto-markup-mode-${mode.id}`}
          >
            {mode.label}
          </AppButton>
        ))}
      </XStack>
      <Paragraph color="$muted" fontFamily="$body" fontSize="$3">
        {
          DESCONTO_MARKUP_MODE_META.find((entry) => entry.id === selected)
            ?.description
        }
      </Paragraph>
    </YStack>
  );
}

interface FieldVisibility {
  readonly price: boolean;
  readonly cost: boolean;
  readonly pct: boolean;
}

const fieldVisibilityFor = (mode: DescontoMarkupMode): FieldVisibility => {
  if (mode === "markup") {
    return { price: false, cost: true, pct: true };
  }
  if (mode === "margem") {
    return { price: true, cost: true, pct: false };
  }
  return { price: true, cost: false, pct: true };
};

const labelFor = (
  mode: DescontoMarkupMode,
  field: "price" | "pct",
): string => {
  if (field === "price") {
    if (mode === "markup") {
      return "";
    }
    if (mode === "reverso") {
      return "Preco final apos desconto (R$)";
    }
    if (mode === "margem") {
      return "Preco de venda (R$)";
    }
    return "Preco original (R$)";
  }
  if (mode === "markup") {
    return "Markup (%)";
  }
  return "Desconto (%)";
};

interface DescontoMarkupFormProps {
  readonly draft: DescontoMarkupFormState;
  readonly errors: Readonly<Record<string, string | undefined>>;
  readonly onFieldChange: <K extends keyof DescontoMarkupFormState>(
    key: K,
    value: DescontoMarkupFormState[K],
  ) => void;
  readonly onSubmit: () => void;
  readonly onReset: () => void;
}

function DescontoMarkupForm(props: DescontoMarkupFormProps): ReactElement {
  const { draft, errors, onFieldChange, onSubmit, onReset } = props;
  const visibility = fieldVisibilityFor(draft.mode);
  return (
    <YStack gap="$3">
      <ModeToggle
        selected={draft.mode}
        onSelect={(mode) => onFieldChange("mode", mode)}
      />
      {visibility.price ? (
        <AppInputField
          id="dm-price"
          label={labelFor(draft.mode, "price")}
          keyboardType="decimal-pad"
          value={draft.price === null ? "" : String(draft.price)}
          onChangeText={(text) => onFieldChange("price", parseDecimal(text))}
          errorText={errors.price}
          placeholder="0,00"
        />
      ) : null}
      {visibility.cost ? (
        <AppInputField
          id="dm-cost"
          label="Custo (R$)"
          keyboardType="decimal-pad"
          value={draft.cost === null ? "" : String(draft.cost)}
          onChangeText={(text) => onFieldChange("cost", parseDecimal(text))}
          errorText={errors.cost}
          placeholder="0,00"
        />
      ) : null}
      {visibility.pct ? (
        <AppInputField
          id="dm-pct"
          label={labelFor(draft.mode, "pct")}
          keyboardType="decimal-pad"
          value={draft.pct === null ? "" : String(draft.pct)}
          onChangeText={(text) => onFieldChange("pct", parseDecimal(text))}
          errorText={errors.pct}
          placeholder="0,00"
        />
      ) : null}
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

interface DescontoMarkupController {
  readonly draft: DescontoMarkupFormState;
  readonly errors: Readonly<Record<string, string | undefined>>;
  readonly result: DescontoMarkupResult | null;
  readonly savedId: string | null;
  readonly isSaving: boolean;
  readonly saveError: unknown;
  readonly onFieldChange: <K extends keyof DescontoMarkupFormState>(
    key: K,
    value: DescontoMarkupFormState[K],
  ) => void;
  readonly onSubmit: () => void;
  readonly onReset: () => void;
  readonly onSave: () => void;
}

const buildFieldHandler = (
  setDraft: Dispatch<SetStateAction<DescontoMarkupFormState>>,
  markDirty: () => void,
) =>
  <K extends keyof DescontoMarkupFormState>(
    key: K,
    value: DescontoMarkupFormState[K],
  ): void => {
    setDraft((prev) => ({ ...prev, [key]: value }));
    markDirty();
  };

const useDescontoMarkupController = (): DescontoMarkupController => {
  const [draft, setDraft] = useState<DescontoMarkupFormState>(
    createDefaultDescontoMarkupFormState,
  );
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [result, setResult] = useState<DescontoMarkupResult | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const saveMutation = useSaveSimulationMutation();

  const markDirty = useCallback((): void => {
    setSavedId(null);
  }, []);

  const onFieldChange = useMemo(
    () => buildFieldHandler(setDraft, markDirty),
    [markDirty],
  );

  const onSubmit = useCallback((): void => {
    const validationErrors = validateDescontoMarkupForm(draft);
    const next: Record<string, string | undefined> = {};
    for (const error of validationErrors) {
      next[error.field as string] = resolveCalculatorError(error.messageKey);
    }
    setErrors(next);
    if (validationErrors.length > 0) {
      setResult(null);
      return;
    }
    setResult(calculateDescontoMarkup(draft));
    setSavedId(null);
  }, [draft]);

  const onReset = useCallback((): void => {
    setDraft(createDefaultDescontoMarkupFormState());
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
          label: `${result.mode} · ${formatBrl(result.calculatedValue)}`,
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
          Desconto, markup e margem
        </Paragraph>
        <Paragraph color="$muted" fontFamily="$body" fontSize="$3">
          Calcule preco final, lucro, margem ou recupere o preco antes do desconto.
        </Paragraph>
      </YStack>
      <AppButton tone="secondary" onPress={onBack}>
        Voltar
      </AppButton>
    </XStack>
  );
}

export function DescontoMarkupScreen(): ReactElement {
  const router = useRouter();
  const ctrl = useDescontoMarkupController();
  const metrics = useMemo<readonly CalculatorMetric[]>(
    () => (ctrl.result === null ? [] : buildMetrics(ctrl.result)),
    [ctrl.result],
  );
  return (
    <AppScreen testID="desconto-markup-screen">
      <Header onBack={() => router.back()} />
      <AppSurfaceCard
        title="Selecione o modo"
        description="Cada modo expoe os campos relevantes para o calculo."
      >
        <DescontoMarkupForm
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
          fallbackTitle="Nao foi possivel salvar"
          fallbackDescription="Confira a conexao e tente novamente."
        />
      ) : null}
      {ctrl.result !== null ? (
        <CalculatorResultCard
          title="Resultado"
          description={
            DESCONTO_MARKUP_MODE_META.find(
              (entry) => entry.id === ctrl.result?.mode,
            )?.description ?? ""
          }
          metrics={metrics}
          isSaving={ctrl.isSaving}
          isSaved={ctrl.savedId !== null}
          onSave={ctrl.onSave}
        />
      ) : null}
    </AppScreen>
  );
}
