import { useCallback, useMemo, useState, type ReactElement } from "react";

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
import { useBrapiFiiQuoteQuery } from "@/features/wallet/hooks/use-brapi-queries";
import {
  calculateFii,
  createDefaultFiiFormState,
  validateFiiForm,
  type FiiFormState,
  type FiiResult,
} from "@/features/tools/services/calculators/fii";
import { resolveCalculatorError } from "@/features/tools/services/calculator-error-messages";
import {
  formatBrl,
  formatPercent,
} from "@/features/tools/services/calculator-formatters";

const TOOL_ID = "fii";
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
  draft: FiiFormState,
  result: FiiResult,
): readonly CalculatorMetric[] => {
  const metrics: CalculatorMetric[] = [
    { label: "Cotação atual", value: formatBrl(result.currentPrice) },
    { label: "Último dividendo", value: formatBrl(result.lastDividend) },
    {
      label: `Média ${draft.historyMonths}m`,
      value: formatBrl(result.avgDividend12m),
      hint: `${result.dividendCount} pagamentos`,
    },
    { label: "Dividend Yield (a.a.)", value: formatPercent(result.dividendYield) },
    {
      label: "Premium vs CDI",
      value: formatPercent(result.vsCdiPremium),
      hint: result.isAboveCdi ? "acima do CDI" : "abaixo do CDI",
    },
  ];
  if (result.yieldOnCost !== null) {
    metrics.push({ label: "Yield on Cost", value: formatPercent(result.yieldOnCost) });
  }
  if (result.monthlyIncome !== null) {
    metrics.push({ label: "Renda mensal estimada", value: formatBrl(result.monthlyIncome) });
  }
  if (result.annualIncome !== null) {
    metrics.push({ label: "Renda anual estimada", value: formatBrl(result.annualIncome) });
  }
  return metrics;
};

interface FiiFormProps {
  readonly draft: FiiFormState;
  readonly errors: Readonly<Record<string, string | undefined>>;
  readonly hasQuote: boolean;
  readonly isFetching: boolean;
  readonly onFieldChange: <K extends keyof FiiFormState>(key: K, value: FiiFormState[K]) => void;
  readonly onSubmit: () => void;
  readonly onReset: () => void;
}

function FiiForm(props: FiiFormProps): ReactElement {
  const { draft, errors, hasQuote, isFetching, onFieldChange, onSubmit, onReset } = props;
  return (
    <YStack gap="$3">
      <AppInputField
        id="field-ticker"
        label="Ticker do FII"
        keyboardType="default"
        value={draft.ticker}
        onChangeText={(text) => onFieldChange("ticker", text.toUpperCase().trim())}
        errorText={errors.ticker}
        placeholder="MXRF11"
      />
      <Paragraph color="$muted" fontFamily="$body" fontSize="$2">
        {isFetching
          ? "Buscando cotação BRAPI..."
          : hasQuote
          ? "Cotação BRAPI carregada para o ticker informado."
          : "Informe um ticker válido (4 letras + 11) para puxar a cotação ao vivo."}
      </Paragraph>
      <AppInputField
        id="field-shares"
        label="Cotas (opcional)"
        keyboardType="number-pad"
        value={draft.shares === null ? "" : String(draft.shares)}
        onChangeText={(text) => {
          const parsed = Number.parseInt(text.trim(), 10);
          onFieldChange("shares", Number.isFinite(parsed) ? parsed : null);
        }}
        placeholder="0"
      />
      <AppInputField
        id="field-avgPurchasePrice"
        label="Preço médio de compra (R$, opcional)"
        keyboardType="decimal-pad"
        value={draft.avgPurchasePrice === null ? "" : String(draft.avgPurchasePrice)}
        onChangeText={(text) => onFieldChange("avgPurchasePrice", parseDecimal(text))}
        placeholder="0,00"
      />
      <AppInputField
        id="field-cdiRatePct"
        label="Taxa CDI (% a.a.)"
        keyboardType="decimal-pad"
        value={String(draft.cdiRatePct)}
        onChangeText={(text) => onFieldChange("cdiRatePct", parseDecimal(text) ?? 0)}
        placeholder="10.65"
      />
      <AppInputField
        id="field-historyMonths"
        label="Histórico de meses (1–24)"
        keyboardType="number-pad"
        value={String(draft.historyMonths)}
        onChangeText={(text) => {
          const parsed = Number.parseInt(text.trim(), 10);
          onFieldChange("historyMonths", Number.isFinite(parsed) ? parsed : draft.historyMonths);
        }}
        errorText={errors.historyMonths}
        placeholder="12"
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

interface FiiControllerState {
  readonly draft: FiiFormState;
  readonly errors: Readonly<Record<string, string | undefined>>;
  readonly result: FiiResult | null;
  readonly savedId: string | null;
  readonly hasQuote: boolean;
  readonly isFetching: boolean;
  readonly quoteError: unknown;
  readonly isSaving: boolean;
  readonly saveError: unknown;
  readonly onFieldChange: <K extends keyof FiiFormState>(key: K, value: FiiFormState[K]) => void;
  readonly onSubmit: () => void;
  readonly onReset: () => void;
  readonly onSave: () => void;
}

const useFiiController = (): FiiControllerState => {
  const [draft, setDraft] = useState<FiiFormState>(createDefaultFiiFormState);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [result, setResult] = useState<FiiResult | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const saveMutation = useSaveSimulationMutation();
  const quoteQuery = useBrapiFiiQuoteQuery(draft.ticker);

  const onFieldChange = useCallback(
    <K extends keyof FiiFormState>(key: K, value: FiiFormState[K]): void => {
      setDraft((prev) => ({ ...prev, [key]: value }));
      setSavedId(null);
    },
    [],
  );

  const onSubmit = useCallback((): void => {
    const validationErrors = validateFiiForm(draft);
    const next: Record<string, string | undefined> = {};
    for (const error of validationErrors) {
      next[error.field as string] = resolveCalculatorError(error.messageKey);
    }
    setErrors(next);
    if (validationErrors.length > 0) {
      setResult(null);
      return;
    }
    const quote = quoteQuery.data;
    if (quote === undefined || quote === null) {
      setErrors((prev) => ({
        ...prev,
        ticker: "Aguarde a cotação BRAPI carregar antes de calcular.",
      }));
      setResult(null);
      return;
    }
    setResult(calculateFii(draft, quote));
    setSavedId(null);
  }, [draft, quoteQuery.data]);

  const onReset = useCallback((): void => {
    setDraft(createDefaultFiiFormState());
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
          label: `${draft.ticker} · DY ${result.dividendYield.toFixed(2)}%`,
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
    hasQuote: quoteQuery.data !== null && quoteQuery.data !== undefined,
    isFetching: quoteQuery.isFetching,
    quoteError: quoteQuery.error,
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
          FII (Fundos imobiliários)
        </Paragraph>
        <Paragraph color="$muted" fontFamily="$body" fontSize="$3">
          Dividend Yield, premium vs CDI e renda passiva projetada via BRAPI.
        </Paragraph>
      </YStack>
      <AppButton tone="secondary" onPress={onBack}>
        Voltar
      </AppButton>
    </XStack>
  );
}

export function FiiScreen(): ReactElement {
  const router = useRouter();
  const ctrl = useFiiController();
  const computedMetrics = useMemo<readonly CalculatorMetric[]>(
    () => (ctrl.result === null ? [] : buildMetrics(ctrl.draft, ctrl.result)),
    [ctrl.draft, ctrl.result],
  );
  return (
    <AppScreen testID="fii-screen">
      <Header onBack={() => router.back()} />
      <AppSurfaceCard
        title="Configure o FII"
        description="Cotação e dividendos vêm do BRAPI ao vivo. Cotas e preço médio são opcionais."
      >
        <FiiForm
          draft={ctrl.draft}
          errors={ctrl.errors}
          hasQuote={ctrl.hasQuote}
          isFetching={ctrl.isFetching}
          onFieldChange={ctrl.onFieldChange}
          onSubmit={ctrl.onSubmit}
          onReset={ctrl.onReset}
        />
      </AppSurfaceCard>
      {ctrl.quoteError !== null ? (
        <AppErrorNotice
          error={ctrl.quoteError}
          fallbackTitle="Cotação indisponível"
          fallbackDescription="Confira o ticker ou tente em alguns instantes."
        />
      ) : null}
      {ctrl.saveError !== null ? (
        <AppErrorNotice
          error={ctrl.saveError}
          fallbackTitle="Não foi possível salvar"
          fallbackDescription="Confira a conexão e tente novamente."
        />
      ) : null}
      {ctrl.result !== null ? (
        <CalculatorResultCard
          title={`${ctrl.draft.ticker} — análise`}
          description="Yield on Cost só aparece quando você informa preço médio."
          metrics={computedMetrics}
          isSaving={ctrl.isSaving}
          isSaved={ctrl.savedId !== null}
          onSave={ctrl.onSave}
        />
      ) : null}
    </AppScreen>
  );
}
