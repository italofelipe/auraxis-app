import { useCallback, useMemo, useState, type Dispatch, type ReactElement, type SetStateAction } from "react";

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
  calculateDividirConta,
  createDefaultDividirContaFormState,
  validateDividirContaForm,
  type DividirContaFormState,
  type DividirContaResult,
} from "@/features/tools/services/calculators/dividir-conta";
import { resolveCalculatorError } from "@/features/tools/services/calculator-error-messages";
import { formatBrl } from "@/features/tools/services/calculator-formatters";

const TOOL_ID = "split-bill";
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

const buildMetrics = (
  draft: DividirContaFormState,
  result: DividirContaResult,
): readonly CalculatorMetric[] => {
  const baseMetrics: CalculatorMetric[] = [
    { label: "Total com taxa e gorjeta", value: formatBrl(result.totalWithFees) },
    { label: "Taxa de serviço", value: formatBrl(result.serviceFeeBrl) },
    { label: "Gorjeta", value: formatBrl(result.tipBrl) },
  ];
  if (draft.mode === "equal") {
    baseMetrics.push({
      label: `Por pessoa (${draft.people}× igual)`,
      value: formatBrl(result.perPersonEqual),
    });
    return baseMetrics;
  }
  return [
    ...baseMetrics,
    ...result.perPersonIndividual.map((amount, idx) => ({
      label: `Pessoa ${idx + 1}`,
      value: formatBrl(amount),
    })),
  ];
};

const resizeAmounts = (
  amounts: readonly (number | null)[],
  newPeople: number,
): (number | null)[] => {
  if (newPeople <= amounts.length) {
    return amounts.slice(0, newPeople);
  }
  return [...amounts, ...Array.from<number | null>({ length: newPeople - amounts.length }).fill(null)];
};

interface SplitFormProps {
  readonly draft: DividirContaFormState;
  readonly errors: Readonly<Record<string, string | undefined>>;
  readonly onFieldChange: <K extends keyof DividirContaFormState>(
    key: K,
    value: DividirContaFormState[K],
  ) => void;
  readonly onPersonAmountChange: (index: number, value: number | null) => void;
  readonly onPeopleChange: (value: number) => void;
  readonly onSubmit: () => void;
  readonly onReset: () => void;
}

interface IndividualAmountsListProps {
  readonly amounts: readonly (number | null)[];
  readonly people: number;
  readonly errorText?: string;
  readonly onChange: (index: number, value: number | null) => void;
}

function IndividualAmountsList(props: IndividualAmountsListProps): ReactElement {
  const { amounts, people, errorText, onChange } = props;
  return (
    <YStack gap="$2">
      {amounts.slice(0, people).map((amount, idx) => (
        <AppInputField
          key={idx}
          id={`amount-${idx}`}
          label={`Consumo da pessoa ${idx + 1} (R$)`}
          keyboardType="decimal-pad"
          value={amount === null ? "" : String(amount)}
          onChangeText={(text) => onChange(idx, parseDecimal(text))}
          placeholder="0,00"
        />
      ))}
      {errorText !== undefined ? (
        <Paragraph color="$danger" fontFamily="$body" fontSize="$2">
          {errorText}
        </Paragraph>
      ) : null}
    </YStack>
  );
}

function SplitForm(props: SplitFormProps): ReactElement {
  const { draft, errors, onFieldChange, onPersonAmountChange, onPeopleChange, onSubmit, onReset } = props;
  return (
    <YStack gap="$3">
      <AppInputField
        id="field-total"
        label="Valor total da conta (R$)"
        keyboardType="decimal-pad"
        value={draft.total === null ? "" : String(draft.total)}
        onChangeText={(text) => onFieldChange("total", parseDecimal(text))}
        errorText={errors.total}
        placeholder="0,00"
      />
      <AppInputField
        id="field-serviceFeePct"
        label="Taxa de serviço (%)"
        keyboardType="decimal-pad"
        value={String(draft.serviceFeePct)}
        onChangeText={(text) => onFieldChange("serviceFeePct", parseDecimal(text) ?? 0)}
        errorText={errors.serviceFeePct}
        placeholder="10"
      />
      <AppInputField
        id="field-tipPct"
        label="Gorjeta extra (%)"
        keyboardType="decimal-pad"
        value={String(draft.tipPct)}
        onChangeText={(text) => onFieldChange("tipPct", parseDecimal(text) ?? 0)}
        errorText={errors.tipPct}
        placeholder="0"
      />
      <AppInputField
        id="field-people"
        label="Quantidade de pessoas"
        keyboardType="number-pad"
        value={String(draft.people)}
        onChangeText={(text) => {
          const parsed = Number.parseInt(text.trim(), 10);
          if (Number.isFinite(parsed) && parsed >= 2) {
            onPeopleChange(parsed);
          }
        }}
        errorText={errors.people}
        placeholder="2"
      />
      <AppToggleRow
        label="Dividir por consumo individual"
        description="Ativado: cada pessoa paga por seu consumo + parcela proporcional das taxas."
        checked={draft.mode === "individual"}
        onCheckedChange={(checked) => onFieldChange("mode", checked ? "individual" : "equal")}
      />
      {draft.mode === "individual" ? (
        <IndividualAmountsList
          amounts={draft.individualAmounts}
          people={draft.people}
          errorText={errors.individualAmounts}
          onChange={onPersonAmountChange}
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

interface SplitControllerState {
  readonly draft: DividirContaFormState;
  readonly errors: Readonly<Record<string, string | undefined>>;
  readonly result: DividirContaResult | null;
  readonly savedId: string | null;
  readonly isSaving: boolean;
  readonly saveError: unknown;
  readonly onFieldChange: <K extends keyof DividirContaFormState>(
    key: K,
    value: DividirContaFormState[K],
  ) => void;
  readonly onPersonAmountChange: (index: number, value: number | null) => void;
  readonly onPeopleChange: (value: number) => void;
  readonly onSubmit: () => void;
  readonly onReset: () => void;
  readonly onSave: () => void;
}

interface SplitDraftHandlers {
  readonly onFieldChange: <K extends keyof DividirContaFormState>(
    key: K,
    value: DividirContaFormState[K],
  ) => void;
  readonly onPersonAmountChange: (index: number, value: number | null) => void;
  readonly onPeopleChange: (value: number) => void;
}

const buildSplitHandlers = (
  setDraft: Dispatch<SetStateAction<DividirContaFormState>>,
  markDirty: () => void,
): SplitDraftHandlers => ({
  onFieldChange: (key, value) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
    markDirty();
  },
  onPersonAmountChange: (index, value) => {
    setDraft((prev) => ({
      ...prev,
      individualAmounts: prev.individualAmounts.map((existing, i) =>
        i === index ? value : existing,
      ),
    }));
    markDirty();
  },
  onPeopleChange: (value) => {
    setDraft((prev) => ({
      ...prev,
      people: value,
      individualAmounts: resizeAmounts(prev.individualAmounts, value),
    }));
    markDirty();
  },
});

const useSplitController = (): SplitControllerState => {
  const [draft, setDraft] = useState<DividirContaFormState>(createDefaultDividirContaFormState);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [result, setResult] = useState<DividirContaResult | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const saveMutation = useSaveSimulationMutation();

  const markDirty = useCallback((): void => {
    setSavedId(null);
  }, []);

  const draftHandlers = useMemo(
    () => buildSplitHandlers(setDraft, markDirty),
    [markDirty],
  );

  const onSubmit = useCallback((): void => {
    const validationErrors = validateDividirContaForm(draft);
    const next: Record<string, string | undefined> = {};
    for (const error of validationErrors) {
      next[error.field as string] = resolveCalculatorError(error.messageKey);
    }
    setErrors(next);
    if (validationErrors.length > 0) {
      setResult(null);
      return;
    }
    setResult(calculateDividirConta(draft));
    setSavedId(null);
  }, [draft]);

  const onReset = useCallback((): void => {
    setDraft(createDefaultDividirContaFormState());
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
          label: `${draft.people} pessoas · ${formatBrl(result.totalWithFees)}`,
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
    ...draftHandlers,
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
          Dividir conta
        </Paragraph>
        <Paragraph color="$muted" fontFamily="$body" fontSize="$3">
          Rateio justo entre amigos com taxa de serviço, gorjeta e modo individual.
        </Paragraph>
      </YStack>
      <AppButton tone="secondary" onPress={onBack}>
        Voltar
      </AppButton>
    </XStack>
  );
}

export function SplitBillScreen(): ReactElement {
  const router = useRouter();
  const ctrl = useSplitController();
  const computedMetrics = useMemo<readonly CalculatorMetric[]>(
    () => (ctrl.result === null ? [] : buildMetrics(ctrl.draft, ctrl.result)),
    [ctrl.draft, ctrl.result],
  );
  return (
    <AppScreen testID="split-bill-screen">
      <Header onBack={() => router.back()} />
      <AppSurfaceCard
        title="Configure o rateio"
        description="Modo igual divide o total. Modo individual divide a parte que cada um consumiu."
      >
        <SplitForm
          draft={ctrl.draft}
          errors={ctrl.errors}
          onFieldChange={ctrl.onFieldChange}
          onPersonAmountChange={ctrl.onPersonAmountChange}
          onPeopleChange={ctrl.onPeopleChange}
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
          title="Quanto cada um paga"
          description={
            ctrl.draft.mode === "equal"
              ? "Divisão igualitária."
              : "Cada pessoa paga seu consumo + parcela proporcional das taxas."
          }
          metrics={computedMetrics}
          isSaving={ctrl.isSaving}
          isSaved={ctrl.savedId !== null}
          onSave={ctrl.onSave}
        />
      ) : null}
    </AppScreen>
  );
}
