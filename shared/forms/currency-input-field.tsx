import { memo, useMemo, type ReactElement } from "react";

import {
  AppInputField,
  type AppInputFieldProps,
} from "@/shared/components/app-input-field";
import {
  centsInputToAmountString,
  formatCurrencyInput,
} from "@/shared/utils/currency";

export interface CurrencyInputFieldProps
  extends Omit<
    AppInputFieldProps,
    "value" | "onChangeText" | "keyboardType" | "inputMode"
  > {
  /** Canonical decimal string (e.g. `"120.25"`) or "" when empty. */
  readonly value: string;
  /** Emits the canonical decimal string on every keystroke. */
  readonly onChangeAmount: (amount: string) => void;
}

/**
 * Money field with Brazilian POS-style entry: each digit shifts the amount in
 * cents (right-to-left), so typing `1,2,0,2,5` reads `0,01 → 0,12 → 1,20 →
 * 12,02 → 120,25`. The visible text always mirrors the canonical value, and
 * the field emits the decimal string the API/validators expect.
 *
 * @param props Field props plus `value`/`onChangeAmount`.
 * @returns A controlled currency input.
 */
const CurrencyInputFieldComponent = ({
  value,
  onChangeAmount,
  placeholder = "0,00",
  ...rest
}: CurrencyInputFieldProps): ReactElement => {
  const display = useMemo(() => {
    if (value.trim().length === 0) {
      return "";
    }
    const numeric = Number(value);
    return formatCurrencyInput(Number.isFinite(numeric) ? numeric : null);
  }, [value]);

  return (
    <AppInputField
      {...rest}
      value={display}
      placeholder={placeholder}
      keyboardType="number-pad"
      onChangeText={(text) => onChangeAmount(centsInputToAmountString(text))}
    />
  );
};

export const CurrencyInputField = memo(CurrencyInputFieldComponent);
