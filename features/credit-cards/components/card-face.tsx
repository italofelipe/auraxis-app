import type { ReactElement } from "react";

import { Paragraph, XStack, YStack } from "tamagui";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import type { CreditCard } from "@/features/credit-cards/contracts";
import { AppGradient } from "@/shared/components/app-gradient";
import { AppMoneyText } from "@/shared/components/app-money-text";
import { borderWidths } from "@/config/design-tokens";
import {
  iconSizes,
  onDarkSurfaceColors,
  resolveCardGradient,
  type GradientStops,
} from "@/shared/theme";
import { formatCurrency } from "@/shared/utils/formatters";

/** Largura padrão da face do cartão no carrossel. */
export const CARD_FACE_WIDTH = 290;
/** Altura padrão da face do cartão. */
const CARD_FACE_HEIGHT = 178;

/** Props da face premium de um cartão de crédito. */
export interface CardFaceProps {
  /** Cartão exibido (define gradiente de marca, nome e final). */
  readonly card: CreditCard;
  /** Total da fatura atual do cartão (consolidado do mês). */
  readonly currentBillTotal: number;
  /** Percentual de uso do limite (0–100), quando disponível. */
  readonly usagePct?: number | null;
  /** Realça o cartão como selecionado (outline + leve elevação). */
  readonly selected?: boolean;
  /** Largura da face (default {@link CARD_FACE_WIDTH}). */
  readonly width?: number;
  /** Handler de toque (seleciona o cartão). */
  readonly onPress?: () => void;
  readonly testID?: string;
}

const maskedNumber = (lastFour: string | null): string =>
  lastFour ? `•••• ${lastFour}` : "•••• ••••";

const clampUsage = (pct: number | null | undefined): number => {
  if (pct === null || pct === undefined || !Number.isFinite(pct)) {
    return 0;
  }
  return Math.min(100, Math.max(0, pct));
};

function CardChrome({
  chipGlyphColor,
}: {
  readonly chipGlyphColor: string;
}): ReactElement {
  return (
    <XStack justifyContent="space-between" alignItems="center">
      <YStack
        width={36}
        height={26}
        borderRadius="$1"
        backgroundColor={onDarkSurfaceColors.chip}
        alignItems="center"
        justifyContent="center"
      >
        <MaterialCommunityIcons
          name="integrated-circuit-chip"
          size={iconSizes.sm}
          color={chipGlyphColor}
        />
      </YStack>
      <MaterialCommunityIcons
        name="contactless-payment"
        size={iconSizes.md}
        color={onDarkSurfaceColors.textMuted}
      />
    </XStack>
  );
}

function CardFooter({
  card,
  currentBillTotal,
  usagePct,
}: {
  readonly card: CreditCard;
  readonly currentBillTotal: number;
  readonly usagePct?: number | null;
}): ReactElement {
  const usageWidth = `${clampUsage(usagePct)}%` as const;
  return (
    <YStack gap="$2">
      <AppMoneyText fontSize="$3" color={onDarkSurfaceColors.text}>
        {maskedNumber(card.lastFourDigits)}
      </AppMoneyText>
      <XStack justifyContent="space-between" alignItems="flex-end">
        <YStack gap="$1">
          <Paragraph
            fontFamily="$body"
            fontSize="$1"
            fontWeight="$7"
            color={onDarkSurfaceColors.textSubtle}
          >
            FATURA ATUAL
          </Paragraph>
          <AppMoneyText fontSize="$6" color={onDarkSurfaceColors.text}>
            {formatCurrency(currentBillTotal)}
          </AppMoneyText>
        </YStack>
        {card.brand ? (
          <Paragraph
            fontFamily="$body"
            fontSize="$2"
            fontWeight="$7"
            color={onDarkSurfaceColors.textMuted}
            textTransform="uppercase"
          >
            {card.brand}
          </Paragraph>
        ) : null}
      </XStack>
      <YStack
        height={6}
        borderRadius="$5"
        backgroundColor={onDarkSurfaceColors.track}
        overflow="hidden"
      >
        <YStack
          height="100%"
          width={usageWidth}
          borderRadius="$5"
          backgroundColor={onDarkSurfaceColors.text}
        />
      </YStack>
    </YStack>
  );
}

/**
 * Face premium de um cartão de crédito: gradiente de marca, chip dourado, marca
 * de bandeira, número mascarado, fatura atual (mono) e mini-barra de uso. Sempre
 * escura com texto branco, independente do tema (cores de {@link onDarkSurfaceColors}).
 *
 * @param props Cartão, total da fatura, uso, seleção e handler de toque.
 * @returns Cartão visual pressionável.
 */
export function CardFace({
  card,
  currentBillTotal,
  usagePct,
  selected = false,
  width = CARD_FACE_WIDTH,
  onPress,
  testID,
}: CardFaceProps): ReactElement {
  const gradient: GradientStops = resolveCardGradient({
    id: card.id,
    bank: card.bank,
    name: card.name,
  });

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
      accessibilityLabel={`Cartão ${card.name}`}
      accessibilityState={{ selected }}
      testID={testID}
    >
      <AppGradient gradient={gradient} borderRadius="$4">
        <YStack
          height={CARD_FACE_HEIGHT}
          padding="$4"
          justifyContent="space-between"
        >
          <CardChrome chipGlyphColor={gradient.colors[1]} />
          <Paragraph
            fontFamily="$body"
            fontSize="$5"
            fontWeight="$6"
            color={onDarkSurfaceColors.text}
            numberOfLines={1}
          >
            {card.name}
          </Paragraph>
          <CardFooter
            card={card}
            currentBillTotal={currentBillTotal}
            usagePct={usagePct}
          />
        </YStack>
      </AppGradient>
    </YStack>
  );
}
