import type { ReactElement } from "react";

import { Paragraph, XStack, YStack } from "tamagui";

import { borderWidths } from "@/config/design-tokens";
import { triggerHapticImpact } from "@/shared/feedback/haptics";

export interface PeriodChipOption<T extends string> {
  readonly value: T;
  readonly label: string;
}

export interface AppPeriodChipsProps<T extends string> {
  readonly options: readonly PeriodChipOption<T>[];
  readonly value: T;
  readonly onChange: (value: T) => void;
  readonly testID?: string;
}

/**
 * Segmented de chips de período (Mês / 3m / 6m…) — paridade com a control bar
 * do dashboard web. Ativo = fundo `primarySubtle` + texto/borda na cor
 * primária; inativo = transparente + texto neutro.
 *
 * @param props Opções, valor selecionado e handler de troca.
 * @returns Linha de chips selecionável.
 */
export function AppPeriodChips<T extends string>({
  options,
  value,
  onChange,
  testID,
}: AppPeriodChipsProps<T>): ReactElement {
  return (
    <XStack gap="$2" testID={testID}>
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <YStack
            key={option.value}
            alignItems="center"
            accessibilityRole="button"
            accessibilityLabel={option.label}
            accessibilityState={{ selected: isActive }}
            testID={`period-chip-${option.value}`}
            onPress={() => {
              triggerHapticImpact("light");
              onChange(option.value);
            }}
            paddingHorizontal="$3"
            paddingVertical="$2"
            borderRadius="$5"
            borderWidth={borderWidths.hairline}
            backgroundColor={isActive ? "$primarySubtle" : "transparent"}
            borderColor={isActive ? "$primary" : "$borderColor"}
            pressStyle={{ backgroundColor: "$surfaceRaised" }}
          >
            <Paragraph
              fontFamily="$body"
              fontSize="$2"
              fontWeight={isActive ? "$6" : "$5"}
              color={isActive ? "$primary" : "$muted"}
            >
              {option.label}
            </Paragraph>
          </YStack>
        );
      })}
    </XStack>
  );
}
