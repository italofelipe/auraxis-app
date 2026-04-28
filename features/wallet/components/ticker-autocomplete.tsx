import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
} from "react";

import { Pressable } from "react-native";
import { Paragraph, XStack, YStack } from "tamagui";

import type { BrapiTickerSearchResult } from "@/features/wallet/brapi-contracts";
import { useBrapiTickerSearchQuery } from "@/features/wallet/hooks/use-brapi-queries";
import { AppFormMessage } from "@/shared/components/app-form-message";
import { AppInputField } from "@/shared/components/app-input-field";

const DEFAULT_DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 2;

export interface TickerAutocompleteProps {
  readonly id: string;
  readonly label?: string;
  readonly placeholder?: string;
  readonly value: string;
  readonly onChange: (next: string) => void;
  readonly onSelect: (result: BrapiTickerSearchResult) => void;
  readonly errorText?: string;
  readonly debounceMs?: number;
  readonly disabled?: boolean;
}

interface ResultRowProps {
  readonly result: BrapiTickerSearchResult;
  readonly onPress: (result: BrapiTickerSearchResult) => void;
}

function ResultRow({ result, onPress }: ResultRowProps): ReactElement {
  const handlePress = useCallback(() => {
    onPress(result);
  }, [onPress, result]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Selecionar ${result.stock}`}
      onPress={handlePress}
      testID={`ticker-autocomplete-result-${result.stock}`}
    >
      <XStack
        paddingVertical="$2"
        paddingHorizontal="$3"
        backgroundColor="$surface"
        borderBottomColor="$borderColor"
        borderBottomWidth={1}
        gap="$3"
        alignItems="center"
      >
        <YStack flex={1} gap="$1">
          <Paragraph color="$color" fontFamily="$body" fontSize="$4">
            {result.stock}
          </Paragraph>
          <Paragraph color="$muted" fontFamily="$body" fontSize="$2" numberOfLines={1}>
            {result.name}
          </Paragraph>
        </YStack>
        {typeof result.close === "number" ? (
          <Paragraph color="$muted" fontFamily="$body" fontSize="$3">
            {result.close.toFixed(2)}
          </Paragraph>
        ) : null}
      </XStack>
    </Pressable>
  );
}

const MemoResultRow = memo(ResultRow);

const useDebouncedValue = (value: string, delayMs: number): string => {
  const [debounced, setDebounced] = useState(value);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current) {
      clearTimeout(timer.current);
    }
    timer.current = setTimeout(() => {
      setDebounced(value);
    }, delayMs);
    return () => {
      if (timer.current) {
        clearTimeout(timer.current);
      }
    };
  }, [value, delayMs]);

  return debounced;
};

/**
 * Inline autocomplete input for BRAPI tickers. Renders an input with a
 * results panel beneath it. Selection forwards the chosen result to the
 * parent and updates the input text to the ticker symbol.
 */
function TickerAutocompleteComponent({
  id,
  label = "Ticker",
  placeholder = "Ex: PETR4",
  value,
  onChange,
  onSelect,
  errorText,
  debounceMs = DEFAULT_DEBOUNCE_MS,
  disabled = false,
}: TickerAutocompleteProps): ReactElement {
  const [isFocused, setIsFocused] = useState(false);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debounced = useDebouncedValue(value, debounceMs);

  useEffect(
    () => () => {
      if (blurTimer.current) {
        clearTimeout(blurTimer.current);
      }
    },
    [],
  );

  const search = useBrapiTickerSearchQuery(debounced);
  const results = useMemo(() => search.data ?? [], [search.data]);

  const showPanel =
    isFocused &&
    !disabled &&
    debounced.trim().length >= MIN_QUERY_LENGTH;

  const handleSelect = useCallback(
    (result: BrapiTickerSearchResult): void => {
      onChange(result.stock);
      onSelect(result);
      setIsFocused(false);
    },
    [onChange, onSelect],
  );

  return (
    <YStack gap="$1">
      <AppInputField
        id={id}
        label={label}
        placeholder={placeholder}
        autoCapitalize="characters"
        autoCorrect={false}
        readOnly={disabled}
        value={value}
        onChangeText={onChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => {
          if (blurTimer.current) {
            clearTimeout(blurTimer.current);
          }
          blurTimer.current = setTimeout(() => setIsFocused(false), 120);
        }}
        errorText={errorText}
      />
      {showPanel ? (
        <ResultsPanel
          isLoading={search.isLoading}
          results={results}
          onSelect={handleSelect}
        />
      ) : null}
      {search.isError ? (
        <AppFormMessage
          tone="danger"
          text="Não foi possível buscar tickers no momento."
        />
      ) : null}
    </YStack>
  );
}

interface ResultsPanelProps {
  readonly isLoading: boolean;
  readonly results: readonly BrapiTickerSearchResult[];
  readonly onSelect: (result: BrapiTickerSearchResult) => void;
}

function ResultsPanel({ isLoading, results, onSelect }: ResultsPanelProps): ReactElement {
  return (
    <YStack
      backgroundColor="$surface"
      borderColor="$borderColor"
      borderWidth={1}
      borderRadius="$2"
      maxHeight={240}
      overflow="hidden"
      testID="ticker-autocomplete-panel"
    >
      {isLoading ? <AppFormMessage tone="muted" text="Buscando ticker…" /> : null}
      {!isLoading && results.length === 0 ? (
        <AppFormMessage tone="muted" text="Nenhum ticker encontrado." />
      ) : null}
      {results.slice(0, 10).map((result) => (
        <MemoResultRow key={result.stock} result={result} onPress={onSelect} />
      ))}
    </YStack>
  );
}

export const TickerAutocomplete = memo(TickerAutocompleteComponent);
