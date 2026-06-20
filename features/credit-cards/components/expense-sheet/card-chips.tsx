import { memo, type ReactElement } from "react";

import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ScrollView } from "react-native";
import { Paragraph, XStack, YStack } from "tamagui";

import { borderWidths } from "@/config/design-tokens";
import type { CreditCard } from "@/features/credit-cards/contracts";
import { AppBadge } from "@/shared/components/app-badge";
import { AppGradient } from "@/shared/components/app-gradient";
import { triggerHapticImpact } from "@/shared/feedback/haptics";
import { iconSizes, resolveCardGradient } from "@/shared/theme";
import { formatCurrencyShort } from "@/shared/utils/formatters";

// Geometria da mini-face do cartão dentro do chip (SVG-like, números OK).
const MINI_FACE_WIDTH = 30;
const MINI_FACE_HEIGHT = 21;

/** Props da trilha horizontal de chips de cartão. */
export interface CardChipsProps {
  /** Cartões disponíveis para seleção (vazio = sem cartões). */
  readonly cards: readonly CreditCard[];
  /** Id do cartão selecionado, ou `null` (cartão é opcional). */
  readonly selectedCardId: string | null;
  /** Seleciona/deseleciona um cartão (toggle). */
  readonly onSelectCard: (cardId: string | null) => void;
  readonly testID?: string;
}

const availabilityLabel = (limitAmount: number | null): string => {
  if (limitAmount === null) {
    return "Sem limite definido";
  }
  return `${formatCurrencyShort(limitAmount)} de limite`;
};

interface CardChipProps {
  readonly card: CreditCard;
  readonly selected: boolean;
  readonly onPress: () => void;
}

function CardChip({ card, selected, onPress }: CardChipProps): ReactElement {
  const gradient = resolveCardGradient({
    id: card.id,
    bank: card.bank,
    name: card.name,
  });
  return (
    <XStack
      accessibilityRole="button"
      accessibilityLabel={`Cartão ${card.name}`}
      accessibilityState={{ selected }}
      testID={`expense-card-chip-${card.id}`}
      onPress={onPress}
      alignItems="center"
      gap="$2"
      paddingVertical="$2"
      paddingHorizontal="$3"
      borderRadius="$2"
      borderWidth={borderWidths.hairline}
      borderColor={selected ? "$primary" : "$borderColor"}
      backgroundColor={selected ? "$primarySubtle" : "$surfaceCard"}
      pressStyle={{ scale: 0.97, backgroundColor: "$surfaceRaised" }}
    >
      <AppGradient
        gradient={gradient}
        borderRadius="$1"
        style={{ width: MINI_FACE_WIDTH, height: MINI_FACE_HEIGHT }}
      />
      <YStack>
        <Paragraph fontFamily="$body" fontSize="$3" fontWeight="$6" color="$color">
          {card.name}
        </Paragraph>
        <Paragraph fontFamily="$body" fontSize="$1" color="$muted">
          {availabilityLabel(card.limitAmount)}
        </Paragraph>
      </YStack>
      {selected ? (
        <MaterialCommunityIcons
          name="check-circle"
          size={iconSizes.sm}
          color={gradient.colors[0]}
        />
      ) : null}
    </XStack>
  );
}

/**
 * Trilha horizontal de chips de cartão (opcional). Cada chip traz uma mini-face
 * com o gradiente de marca, o nome e o limite. Tocar seleciona; tocar de novo
 * deseleciona (o cartão nunca é obrigatório — pílula "opcional agora").
 *
 * @param props Cartões, seleção atual e handler de toggle.
 * @returns Cabeçalho + scroll horizontal de chips, ou aviso de "sem cartões".
 */
const CardChipsComponent = ({
  cards,
  selectedCardId,
  onSelectCard,
  testID,
}: CardChipsProps): ReactElement => {
  return (
    <YStack gap="$2" testID={testID}>
      <XStack alignItems="center" gap="$2">
        <Paragraph
          fontFamily="$body"
          fontSize="$2"
          fontWeight="$6"
          color="$muted"
          textTransform="uppercase"
        >
          Cartão
        </Paragraph>
        <AppBadge>opcional agora</AppBadge>
      </XStack>
      {cards.length === 0 ? (
        <Paragraph fontFamily="$body" fontSize="$3" color="$muted">
          Nenhum cartão cadastrado — você pode lançar mesmo assim.
        </Paragraph>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 10, paddingBottom: 2 }}
        >
          {cards.map((card) => (
            <CardChip
              key={card.id}
              card={card}
              selected={card.id === selectedCardId}
              onPress={() => {
                triggerHapticImpact("light");
                onSelectCard(card.id === selectedCardId ? null : card.id);
              }}
            />
          ))}
        </ScrollView>
      )}
    </YStack>
  );
};

export const CardChips = memo(CardChipsComponent);
