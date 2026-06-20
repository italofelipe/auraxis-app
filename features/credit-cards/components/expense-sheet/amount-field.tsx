import { memo, useMemo, type ReactElement } from "react";

import { Input, Paragraph, XStack, YStack, styled } from "tamagui";

import { borderWidths } from "@/config/design-tokens";
import {
  centsInputToAmountString,
  formatCurrencyInput,
} from "@/shared/utils/currency";

// Input monetário "hero": grande, mono e sem borda, sobre a superfície tintada
// de marca da seção. A fonte vem do token `$mono` ($9 = maior tamanho mono do
// DS) — sem fontSize literal (governança). O símbolo "R$" fica fixo à esquerda.
const HeroAmountInput = styled(Input, {
  flex: 1,
  backgroundColor: "transparent",
  borderWidth: 0,
  paddingHorizontal: "$0",
  color: "$primary",
  fontFamily: "$mono",
  fontSize: "$9",
  fontWeight: "$6",
  placeholderTextColor: "$primarySubtle",
});

/** Props do campo de valor da compra (hero). */
export interface AmountFieldProps {
  /** Valor canônico decimal (ex.: `"120.25"`) ou `""` quando vazio. */
  readonly value: string;
  /** Emite a string decimal canônica a cada dígito (POS-style). */
  readonly onChangeAmount: (amount: string) => void;
  readonly testID?: string;
}

/**
 * Campo de destaque "Valor da compra": entrada estilo POS (cada dígito desloca
 * o valor em centavos, da direita para a esquerda) renderizada em mono grande
 * sobre a superfície tintada de marca. Reaproveita os utilitários de moeda
 * compartilhados (`centsInputToAmountString`/`formatCurrencyInput`) para
 * espelhar o `CurrencyInputField`, mas com a tipografia hero do handoff.
 *
 * @param props Valor canônico, handler de mudança e `testID` opcional.
 * @returns Bloco hero com label, prefixo "R$" e input mono.
 */
const AmountFieldComponent = ({
  value,
  onChangeAmount,
  testID,
}: AmountFieldProps): ReactElement => {
  const display = useMemo(() => {
    if (value.trim().length === 0) {
      return "";
    }
    const numeric = Number(value);
    return formatCurrencyInput(Number.isFinite(numeric) ? numeric : null);
  }, [value]);

  return (
    <YStack
      gap="$1"
      padding="$4"
      borderRadius="$3"
      borderWidth={borderWidths.hairline}
      borderColor="$primary"
      backgroundColor="$primarySubtle"
      testID={testID}
    >
      <Paragraph
        fontFamily="$body"
        fontSize="$2"
        fontWeight="$6"
        color="$muted"
        textTransform="uppercase"
      >
        Valor da compra
      </Paragraph>
      <XStack alignItems="center" gap="$2">
        <Paragraph fontFamily="$mono" fontSize="$7" fontWeight="$6" color="$primary">
          R$
        </Paragraph>
        <HeroAmountInput
          value={display}
          placeholder="0,00"
          keyboardType="number-pad"
          accessibilityLabel="Valor da compra"
          testID={testID ? `${testID}-input` : undefined}
          onChangeText={(text: string) =>
            onChangeAmount(centsInputToAmountString(text))
          }
        />
      </XStack>
    </YStack>
  );
};

export const AmountField = memo(AmountFieldComponent);
