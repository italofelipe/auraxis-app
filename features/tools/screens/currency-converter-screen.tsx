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
import { useBrapiCurrenciesQuery } from "@/features/wallet/hooks/use-brapi-queries";
import {
  CURRENCY_PAIRS,
  calculateConversorMoeda,
  createDefaultConversorMoedaFormState,
  validateConversorMoedaForm,
  type ConversorMoedaFormState,
  type ConversorMoedaResult,
  type CurrencyPair,
} from "@/features/tools/services/calculators/conversor-moeda";
import { resolveCalculatorError } from "@/features/tools/services/calculator-error-messages";
import { formatPercent } from "@/features/tools/services/calculator-formatters";

const TOOL_ID = "currency-converter";
const RULE_VERSION = "2026.04";

const formatAmount = (amount: number, currency: string): string => {
  if (currency === "BRL") {
    return amount.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
  if (currency === "BTC") {
    return `${amount.toLocaleString("pt-BR", { minimumFractionDigits: 6, maximumFractionDigits: 8 })} BTC`;
  }
  return `${amount.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 4 })} ${currency}`;
};

const formatRate = (rate: number): string =>
  rate.toLocaleString("pt-BR", {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  });

const isCurrencyPair = (value: string): value is CurrencyPair =>
  (CURRENCY_PAIRS as readonly string[]).includes(value);

const parseDecimal = (raw: string): number | null => {
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return null;
  }
  const normalized = trimmed.replace(/\./g, "").replace(",", ".");
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

const buildMetrics = (result: ConversorMoedaResult): readonly CalculatorMetric[] => {
  const baseMetrics: CalculatorMetric[] = [
    { label: "Valor convertido", value: formatAmount(result.convertedAmount, result.toCurrency) },
    {
      label: "Taxa usada",
      value: `R$ ${formatRate(result.rate)}`,
      hint: result.source === "brapi" ? "BRAPI" : "manual",
    },
  ];
  if (result.source === "brapi") {
    baseMetrics.push(
      { label: "Bid (compra de moeda)", value: `R$ ${formatRate(result.bid)}` },
      { label: "Ask (venda de moeda)", value: `R$ ${formatRate(result.ask)}` },
      { label: "Variação no dia", value: formatPercent(result.pctChange) },
    );
  }
  return baseMetrics;
};

interface ConverterFormProps {
  readonly draft: ConversorMoedaFormState;
  readonly errors: Readonly<Record<string, string | undefined>>;
  readonly hasLiveQuote: boolean;
  readonly onFieldChange: <K extends keyof ConversorMoedaFormState>(
    key: K,
    value: ConversorMoedaFormState[K],
  ) => void;
  readonly onSubmit: () => void;
  readonly onReset: () => void;
}

function ConverterForm(props: ConverterFormProps): ReactElement {
  const { draft, errors, hasLiveQuote, onFieldChange, onSubmit, onReset } = props;
  return (
    <YStack gap="$3">
      <AppInputField
        id="field-amount"
        label="Valor a converter"
        keyboardType="decimal-pad"
        value={draft.amount === null ? "" : String(draft.amount)}
        onChangeText={(text) => onFieldChange("amount", parseDecimal(text))}
        errorText={errors.amount}
        placeholder=""
      />
      <AppInputField
        id="field-pair"
        label="Par de moedas"
        keyboardType="default"
        value={draft.pair}
        onChangeText={(text) => {
          const normalized = text.trim().toUpperCase();
          if (isCurrencyPair(normalized)) {
            onFieldChange("pair", normalized);
          }
        }}
        placeholder="USD-BRL"
      />
      <Paragraph color="$muted" fontFamily="$body" fontSize="$2">
        Pares suportados: {CURRENCY_PAIRS.join(", ")}.
      </Paragraph>
      <AppToggleRow
        label="Vender moeda estrangeira"
        description="Ativado: você tem moeda estrangeira e quer reais. Desativado: você tem reais e quer comprar moeda estrangeira."
        checked={draft.direction === "sell"}
        onCheckedChange={(checked) =>
          onFieldChange("direction", checked ? "sell" : "buy")
        }
      />
      <AppInputField
        id="field-manual-rate"
        label="Taxa manual (R$ por moeda estrangeira)"
        keyboardType="decimal-pad"
        value={draft.manualRate === null ? "" : String(draft.manualRate)}
        onChangeText={(text) => onFieldChange("manualRate", parseDecimal(text))}
        errorText={errors.manualRate}
        placeholder=""
      />
      <Paragraph color="$muted" fontFamily="$body" fontSize="$2">
        {hasLiveQuote
          ? "Cotação BRAPI disponível — taxa manual é ignorada quando preenchida."
          : "Sem cotação ao vivo agora. Informe a taxa manual para calcular."}
      </Paragraph>
      <XStack gap="$2">
        <AppButton tone="primary" onPress={onSubmit}>
          Converter
        </AppButton>
        <AppButton tone="secondary" onPress={onReset}>
          Limpar
        </AppButton>
      </XStack>
    </YStack>
  );
}

interface ConverterControllerState {
  readonly draft: ConversorMoedaFormState;
  readonly errors: Readonly<Record<string, string | undefined>>;
  readonly result: ConversorMoedaResult | null;
  readonly savedId: string | null;
  readonly hasLiveQuote: boolean;
  readonly liveQuoteError: unknown;
  readonly isSaving: boolean;
  readonly saveError: unknown;
  readonly onFieldChange: <K extends keyof ConversorMoedaFormState>(
    key: K,
    value: ConversorMoedaFormState[K],
  ) => void;
  readonly onSubmit: () => void;
  readonly onReset: () => void;
  readonly onSave: () => void;
}

const useConverterController = (): ConverterControllerState => {
  const [draft, setDraft] = useState<ConversorMoedaFormState>(
    createDefaultConversorMoedaFormState,
  );
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [result, setResult] = useState<ConversorMoedaResult | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const saveMutation = useSaveSimulationMutation();
  const currenciesQuery = useBrapiCurrenciesQuery([draft.pair]);

  const liveQuote = useMemo(
    () => currenciesQuery.data?.[0] ?? null,
    [currenciesQuery.data],
  );
  const hasLiveQuote = liveQuote !== null && currenciesQuery.isSuccess;

  const onFieldChange = useCallback(
    <K extends keyof ConversorMoedaFormState>(
      key: K,
      value: ConversorMoedaFormState[K],
    ): void => {
      setDraft((prev) => ({ ...prev, [key]: value }));
      setSavedId(null);
    },
    [],
  );

  const onSubmit = useCallback((): void => {
    const validationErrors = validateConversorMoedaForm(draft, hasLiveQuote);
    const next: Record<string, string | undefined> = {};
    for (const error of validationErrors) {
      next[error.field] = resolveCalculatorError(error.messageKey);
    }
    setErrors(next);
    if (validationErrors.length > 0) {
      setResult(null);
      return;
    }
    setResult(calculateConversorMoeda(draft, liveQuote));
    setSavedId(null);
  }, [draft, hasLiveQuote, liveQuote]);

  const onReset = useCallback((): void => {
    setDraft(createDefaultConversorMoedaFormState());
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
          label: `${draft.pair} · ${draft.direction === "buy" ? "compra" : "venda"} · ${formatAmount(draft.amount ?? 0, result.fromCurrency)}`,
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
    hasLiveQuote,
    liveQuoteError: currenciesQuery.error,
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
          Conversor de moedas
        </Paragraph>
        <Paragraph color="$muted" fontFamily="$body" fontSize="$3">
          Cotações ao vivo BRAPI com fallback para taxa manual.
        </Paragraph>
      </YStack>
      <AppButton tone="secondary" onPress={onBack}>
        Voltar
      </AppButton>
    </XStack>
  );
}

/**
 * Currency converter screen — uses live BRAPI quotes with manual fallback.
 * @returns The screen tree.
 */
export function CurrencyConverterScreen(): ReactElement {
  const router = useRouter();
  const ctrl = useConverterController();
  return (
    <AppScreen testID="currency-converter-screen">
      <Header onBack={() => router.back()} />
      <AppSurfaceCard
        title="Configure a conversão"
        description="Escolha o par, a direção e o valor. A cotação ao vivo vem do BRAPI."
      >
        <ConverterForm
          draft={ctrl.draft}
          errors={ctrl.errors}
          hasLiveQuote={ctrl.hasLiveQuote}
          onFieldChange={ctrl.onFieldChange}
          onSubmit={ctrl.onSubmit}
          onReset={ctrl.onReset}
        />
      </AppSurfaceCard>
      {ctrl.liveQuoteError !== null ? (
        <AppErrorNotice
          error={ctrl.liveQuoteError}
          fallbackTitle="Cotação ao vivo indisponível"
          fallbackDescription="Use a taxa manual ou tente novamente em alguns instantes."
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
          title={`${ctrl.result.fromCurrency} → ${ctrl.result.toCurrency}`}
          description={
            ctrl.result.source === "brapi"
              ? "Taxa BRAPI ao vivo aplicada."
              : "Taxa manual aplicada — sem cotação ao vivo no momento."
          }
          metrics={buildMetrics(ctrl.result)}
          isSaving={ctrl.isSaving}
          isSaved={ctrl.savedId !== null}
          onSave={ctrl.onSave}
        />
      ) : null}
    </AppScreen>
  );
}
