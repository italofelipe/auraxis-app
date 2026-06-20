import type { ReactElement } from "react";

import { Paragraph, XStack, YStack } from "tamagui";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { AppGradient } from "@/shared/components/app-gradient";
import { AppMoneyText } from "@/shared/components/app-money-text";
import { borderWidths } from "@/config/design-tokens";
import { allCardsGradient, iconSizes, onDarkSurfaceColors } from "@/shared/theme";
import { formatCurrency } from "@/shared/utils/formatters";
import { CARD_FACE_WIDTH } from "@/features/credit-cards/components/card-face";

const ALL_CARDS_HEIGHT = 178;

/** Props do cartão agregado "Todos os cartões". */
export interface AllCardsCardProps {
  /** Total consolidado das faturas do mês (todos os cartões). */
  readonly total: number;
  /** Quantidade de cartões agregados. */
  readonly cardCount: number;
  /** Realça como selecionado. */
  readonly selected?: boolean;
  /** Largura da face (default igual ao {@link CARD_FACE_WIDTH}). */
  readonly width?: number;
  /** Handler de toque (seleciona "Todos"). */
  readonly onPress?: () => void;
  readonly testID?: string;
}

/**
 * Cartão agregado "Todos os cartões" (teal escuro): ícone em camadas, título e o
 * total consolidado das faturas do mês em mono grande. Primeiro item do carrossel.
 *
 * @param props Total consolidado, contagem de cartões, seleção e handler.
 * @returns Cartão agregado pressionável.
 */
export function AllCardsCard({
  total,
  cardCount,
  selected = false,
  width = CARD_FACE_WIDTH,
  onPress,
  testID,
}: AllCardsCardProps): ReactElement {
  return (
    <YStack
      width={width}
      borderRadius="$4"
      borderWidth={selected ? borderWidths.hairline : 0}
      borderColor={selected ? onDarkSurfaceColors.selectedBorder : "transparent"}
      scale={selected ? 1 : 0.98}
      onPress={onPress}
      pressStyle={onPress ? { scale: 0.96 } : undefined}
      accessibilityRole={onPress ? "button" : undefined}
      accessibilityLabel="Todos os cartões"
      accessibilityState={{ selected }}
      testID={testID}
    >
      <AppGradient gradient={allCardsGradient} borderRadius="$4">
        <YStack height={ALL_CARDS_HEIGHT} padding="$4" justifyContent="space-between">
          <XStack justifyContent="space-between" alignItems="center">
            <YStack
              width={40}
              height={40}
              borderRadius="$2"
              backgroundColor={onDarkSurfaceColors.controlBackground}
              alignItems="center"
              justifyContent="center"
            >
              <MaterialCommunityIcons
                name="credit-card-multiple-outline"
                size={iconSizes.md}
                color={onDarkSurfaceColors.text}
              />
            </YStack>
            <Paragraph
              fontFamily="$body"
              fontSize="$2"
              fontWeight="$6"
              color={onDarkSurfaceColors.textMuted}
            >
              {`${cardCount} cartões`}
            </Paragraph>
          </XStack>

          <Paragraph
            fontFamily="$body"
            fontSize="$5"
            fontWeight="$6"
            color={onDarkSurfaceColors.text}
            numberOfLines={1}
          >
            Todos os cartões
          </Paragraph>

          <YStack gap="$1">
            <Paragraph
              fontFamily="$body"
              fontSize="$1"
              fontWeight="$7"
              color={onDarkSurfaceColors.textSubtle}
            >
              FATURAS DO MÊS
            </Paragraph>
            <AppMoneyText fontSize="$7" color={onDarkSurfaceColors.text}>
              {formatCurrency(total)}
            </AppMoneyText>
          </YStack>
        </YStack>
      </AppGradient>
    </YStack>
  );
}
