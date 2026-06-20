import type { ReactElement } from "react";
import { FlatList, type ListRenderItemInfo } from "react-native";

import { XStack } from "tamagui";

import type { CreditCard } from "@/features/credit-cards/contracts";
import {
  AllCardsCard,
} from "@/features/credit-cards/components/all-cards-card";
import {
  CARD_FACE_WIDTH,
  CardFace,
} from "@/features/credit-cards/components/card-face";
import { semanticSpacing } from "@/shared/theme";

/** Espaçamento entre as faces no carrossel (token md = 16). */
const CARD_GAP = semanticSpacing.md;
/** Item virtual que representa o card agregado "Todos". */
const ALL_CARDS_ITEM = "__all__" as const;

type CarouselItem = typeof ALL_CARDS_ITEM | CreditCard;

/** Props do carrossel horizontal de cartões. */
export interface CardCarouselProps {
  /** Cartões do usuário (renderizados após o card "Todos"). */
  readonly cards: readonly CreditCard[];
  /** Cartão selecionado (null = "Todos os cartões"). */
  readonly selectedCardId: string | null;
  /** Seleciona um cartão (ou null para "Todos"). */
  readonly onSelectCard: (cardId: string | null) => void;
  /** Total consolidado do mês (card "Todos"). */
  readonly consolidatedTotal: number;
  /** Total da fatura do mês por cartão (`cardId` → total). */
  readonly monthTotalsByCard: Readonly<Record<string, number>>;
  /** Percentual de uso do limite por cartão (`cardId` → pct), opcional. */
  readonly usageByCard?: Readonly<Record<string, number | null>>;
  readonly testID?: string;
}

const keyForItem = (item: CarouselItem): string =>
  item === ALL_CARDS_ITEM ? ALL_CARDS_ITEM : item.id;

/**
 * Carrossel horizontal de cartões com snap central: o primeiro item é o card
 * agregado "Todos os cartões" e os demais são as faces dos cartões. Tocar num
 * item o seleciona (dirige o conteúdo abaixo). Apresentacional — recebe totais
 * e seleção via props.
 *
 * @param props Cartões, seleção, totais por cartão e handler de seleção.
 * @returns Lista horizontal com snap.
 */
export function CardCarousel({
  cards,
  selectedCardId,
  onSelectCard,
  consolidatedTotal,
  monthTotalsByCard,
  usageByCard,
  testID,
}: CardCarouselProps): ReactElement {
  const data: readonly CarouselItem[] = [ALL_CARDS_ITEM, ...cards];

  const renderItem = ({
    item,
  }: ListRenderItemInfo<CarouselItem>): ReactElement => {
    if (item === ALL_CARDS_ITEM) {
      return (
        <AllCardsCard
          total={consolidatedTotal}
          cardCount={cards.length}
          selected={selectedCardId === null}
          onPress={() => onSelectCard(null)}
          testID="card-carousel-all"
        />
      );
    }
    return (
      <CardFace
        card={item}
        currentBillTotal={monthTotalsByCard[item.id] ?? 0}
        usagePct={usageByCard?.[item.id] ?? null}
        selected={selectedCardId === item.id}
        onPress={() => onSelectCard(item.id)}
        testID={`card-carousel-card-${item.id}`}
      />
    );
  };

  return (
    <FlatList
      horizontal
      data={data as CarouselItem[]}
      keyExtractor={keyForItem}
      renderItem={renderItem}
      showsHorizontalScrollIndicator={false}
      snapToInterval={CARD_FACE_WIDTH + CARD_GAP}
      snapToAlignment="center"
      decelerationRate="fast"
      ItemSeparatorComponent={Separator}
      contentContainerStyle={{
        paddingHorizontal: semanticSpacing.lg,
      }}
      testID={testID ?? "card-carousel"}
    />
  );
}

const Separator = (): ReactElement => <XStack width={CARD_GAP} />;
