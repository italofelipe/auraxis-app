import type { ReactElement } from "react";
import { ScrollView } from "react-native";

import { Paragraph, XStack } from "tamagui";

import type { CardsHomeMonthChip } from "@/features/credit-cards/hooks/use-cards-home-controller";
import { borderWidths } from "@/config/design-tokens";
import { triggerHapticImpact } from "@/shared/feedback/haptics";

/** Props da régua horizontal de chips de mês. */
export interface MonthChipsProps {
  /** Chips de mês (do mais antigo ao mais recente). */
  readonly months: readonly CardsHomeMonthChip[];
  /** Mês selecionado (`YYYY-MM`). */
  readonly selectedMonth: string;
  /** Seleciona um mês. */
  readonly onSelect: (month: string) => void;
  readonly testID?: string;
}

/**
 * Régua horizontal de chips de mês de fatura. O chip do mês selecionado ganha
 * fundo primário; o mês de fatura atual recebe um ponto de destaque. Rola
 * horizontalmente quando há mais meses que cabem na largura.
 *
 * @param props Chips, mês selecionado e handler de seleção.
 * @returns Lista rolável de chips de mês.
 */
export function MonthChips({
  months,
  selectedMonth,
  onSelect,
  testID,
}: MonthChipsProps): ReactElement {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      testID={testID ?? "month-chips"}
    >
      <XStack gap="$2" paddingVertical="$1">
        {months.map((chip) => {
          const isActive = chip.month === selectedMonth;
          return (
            <XStack
              key={chip.month}
              alignItems="center"
              gap="$1"
              paddingHorizontal="$3"
              paddingVertical="$2"
              borderRadius="$5"
              borderWidth={borderWidths.hairline}
              backgroundColor={isActive ? "$primarySubtle" : "transparent"}
              borderColor={isActive ? "$primary" : "$borderColor"}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={chip.label}
              testID={`month-chip-${chip.month}`}
              pressStyle={{ backgroundColor: "$surfaceRaised" }}
              onPress={() => {
                triggerHapticImpact("light");
                onSelect(chip.month);
              }}
            >
              <Paragraph
                fontFamily="$body"
                fontSize="$3"
                fontWeight={isActive ? "$7" : "$5"}
                color={isActive ? "$primary" : "$muted"}
              >
                {chip.shortLabel}
              </Paragraph>
              {chip.isCurrent ? (
                <Paragraph
                  fontFamily="$body"
                  fontSize="$3"
                  fontWeight="$7"
                  color={isActive ? "$primary" : "$muted"}
                >
                  ·
                </Paragraph>
              ) : null}
            </XStack>
          );
        })}
      </XStack>
    </ScrollView>
  );
}
