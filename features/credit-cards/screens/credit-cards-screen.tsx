import { useMemo, type ReactElement } from "react";

import { useRouter } from "expo-router";
import { Paragraph, XStack, YStack, useTheme } from "tamagui";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import {
  buildCreditCardBillPath,
  buildCreditCardDetailPath,
} from "@/core/navigation/routes";
import { useResolvedTheme } from "@/core/shell/use-resolved-theme";
import { useAppShellStore } from "@/core/shell/app-shell-store";
import { AnaliticoView } from "@/features/credit-cards/components/analitico-view";
import { CardCarousel } from "@/features/credit-cards/components/card-carousel";
import { CardsSegmented } from "@/features/credit-cards/components/cards-segmented";
import { CreditCardForm } from "@/features/credit-cards/components/credit-card-form";
import { FaturasView } from "@/features/credit-cards/components/faturas-view";
import { MonthChips } from "@/features/credit-cards/components/month-chips";
import type { CreditCard } from "@/features/credit-cards/contracts";
import {
  useCardsHomeController,
  type CardsHomeController,
} from "@/features/credit-cards/hooks/use-cards-home-controller";
import { useCreditCardsScreenController } from "@/features/credit-cards/hooks/use-credit-cards-screen-controller";
import { AppGradient } from "@/shared/components/app-gradient";
import { AppQueryState } from "@/shared/components/app-query-state";
import { AppScreen } from "@/shared/components/app-screen";
import {
  darkSemanticGradients,
  iconSizes,
  lightSemanticGradients,
  onDarkSurfaceColors,
} from "@/shared/theme";
import { formatCurrencyShort } from "@/shared/utils/formatters";

const CONSOLIDATED_EYEBROW = "Fatura consolidada";

/**
 * HOME redesenhada de "Cartões": hero teal + carrossel de cartões, segmented
 * Faturas/Analítico e a visão selecionada. Consome o controller de leitura
 * (`useCardsHomeController`) e o controller de CRUD (`useCreditCardsScreenController`)
 * — este último mantém o formulário de criar/editar cartão acessível.
 *
 * @returns Tela de Cartões.
 */
export function CreditCardsScreen(): ReactElement {
  const home = useCardsHomeController();
  const crud = useCreditCardsScreenController();
  const router = useRouter();

  const cards = useMemo<readonly CreditCard[]>(
    () => home.cardsQuery.data?.creditCards ?? [],
    [home.cardsQuery.data?.creditCards],
  );

  if (crud.formMode.kind !== "closed") {
    return (
      <AppScreen>
        <CreditCardForm
          initialCreditCard={
            crud.formMode.kind === "edit" ? crud.formMode.creditCard : null
          }
          isSubmitting={crud.isSubmitting}
          submitError={crud.submitError}
          onSubmit={crud.handleSubmit}
          onCancel={crud.handleCloseForm}
          onDismissError={crud.dismissSubmitError}
        />
      </AppScreen>
    );
  }

  return (
    <AppScreen testID="credit-cards-screen">
      <CardsHero cards={cards} onAddCard={crud.handleOpenCreate} />
      <AppQueryState
        query={home.cardsQuery}
        options={{
          loading: {
            title: "Carregando cartões",
            description: "Buscando seus cartões e faturas.",
          },
          empty: {
            title: "Nenhum cartão ainda",
            description: "Adicione um cartão para acompanhar suas faturas.",
          },
          error: {
            fallbackTitle: "Não foi possível carregar os cartões",
            fallbackDescription: "Tente novamente em instantes.",
          },
          isEmpty: () => cards.length === 0,
        }}
      >
        {() => (
          <HomeBody home={home} cards={cards} router={router} />
        )}
      </AppQueryState>
    </AppScreen>
  );
}

interface HeroProps {
  readonly cards: readonly CreditCard[];
  readonly onAddCard: () => void;
}

function CardsHero({ cards, onAddCard }: HeroProps): ReactElement {
  const resolvedTheme = useResolvedTheme();
  const setThemePreference = useAppShellStore(
    (state) => state.setThemePreference,
  );
  const heroGradient =
    resolvedTheme === "auraxis_dark"
      ? darkSemanticGradients.hero
      : lightSemanticGradients.hero;
  const isDark = resolvedTheme === "auraxis_dark";

  const limitTotal = cards.reduce(
    (sum, card) => sum + (card.limitAmount ?? 0),
    0,
  );
  const subtitle = `${cards.length} cartões · limite ${formatCurrencyShort(limitTotal)}`;

  return (
    <AppGradient gradient={heroGradient} borderRadius="$3">
      <XStack
        padding="$5"
        justifyContent="space-between"
        alignItems="flex-start"
        gap="$3"
      >
        <YStack flex={1} gap="$1">
          <Paragraph
            fontFamily="$heading"
            fontWeight="$7"
            fontSize="$8"
            color={onDarkSurfaceColors.text}
          >
            Cartões
          </Paragraph>
          <Paragraph
            fontFamily="$body"
            fontSize="$3"
            color={onDarkSurfaceColors.textMuted}
          >
            {subtitle}
          </Paragraph>
        </YStack>
        <XStack gap="$2">
          <HeroRoundButton
            icon={isDark ? "white-balance-sunny" : "weather-night"}
            accessibilityLabel="Alternar tema"
            testID="tour-theme"
            onPress={() =>
              setThemePreference(isDark ? "light" : "dark")
            }
          />
          <HeroRoundButton
            icon="help-circle-outline"
            accessibilityLabel="Ajuda"
            testID="cards-help-button"
            onPress={noop}
          />
          <HeroRoundButton
            icon="credit-card-plus-outline"
            accessibilityLabel="Adicionar cartão"
            testID="cards-add-button"
            onPress={onAddCard}
          />
        </XStack>
      </XStack>
    </AppGradient>
  );
}

interface HeroRoundButtonProps {
  readonly icon: keyof typeof MaterialCommunityIcons.glyphMap;
  readonly accessibilityLabel: string;
  readonly onPress: () => void;
  readonly testID?: string;
}

function HeroRoundButton({
  icon,
  accessibilityLabel,
  onPress,
  testID,
}: HeroRoundButtonProps): ReactElement {
  return (
    <YStack
      width={44}
      height={44}
      borderRadius="$5"
      alignItems="center"
      justifyContent="center"
      backgroundColor={onDarkSurfaceColors.controlBackground}
      pressStyle={{ backgroundColor: onDarkSurfaceColors.controlBackgroundPressed }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      onPress={onPress}
    >
      <MaterialCommunityIcons
        name={icon}
        size={iconSizes.md}
        color={onDarkSurfaceColors.text}
      />
    </YStack>
  );
}

interface HomeBodyProps {
  readonly home: CardsHomeController;
  readonly cards: readonly CreditCard[];
  readonly router: ReturnType<typeof useRouter>;
}

function HomeBody({ home, cards, router }: HomeBodyProps): ReactElement {
  const monthTotalsByCard = useMemo<Record<string, number>>(() => {
    const record: Record<string, number> = {};
    for (const entry of home.faturas.railTotals) {
      record[entry.cardId] = entry.total;
    }
    return record;
  }, [home.faturas.railTotals]);

  const eyebrow = resolveEyebrow(home.selectedCardId, cards);
  const monthShortLabel =
    home.months.find((chip) => chip.month === home.selectedMonth)?.shortLabel ??
    home.selectedMonth;

  const openInvoice = (): void => {
    const targetCardId = home.selectedCardId ?? cards[0]?.id ?? null;
    if (targetCardId) {
      router.push(buildCreditCardBillPath(targetCardId));
    }
  };

  return (
    <YStack gap="$4">
      <YStack testID="tour-cards">
        <CardCarousel
          cards={cards}
          selectedCardId={home.selectedCardId}
          onSelectCard={home.selectCard}
          consolidatedTotal={home.faturas.allCardsTotal}
          monthTotalsByCard={monthTotalsByCard}
        />
      </YStack>

      {home.selectedCardId ? (
        <CardDetailLink
          onPress={() =>
            router.push(buildCreditCardDetailPath(home.selectedCardId ?? ""))
          }
        />
      ) : null}

      <YStack testID="tour-views">
        <CardsSegmented value={home.view} onChange={home.setView} />
      </YStack>

      {home.view === "faturas" ? (
        <YStack gap="$4">
          <YStack testID="tour-months">
            <MonthChips
              months={home.months}
              selectedMonth={home.selectedMonth}
              onSelect={home.selectMonth}
            />
          </YStack>
          <YStack testID="tour-fatura">
            <FaturasView
              faturas={home.faturas}
              eyebrow={eyebrow}
              onOpenInvoice={openInvoice}
            />
          </YStack>
        </YStack>
      ) : (
        <AnaliticoView
          analitico={home.analitico}
          monthShortLabel={monthShortLabel}
        />
      )}
    </YStack>
  );
}

function CardDetailLink({
  onPress,
}: {
  readonly onPress: () => void;
}): ReactElement {
  const theme = useTheme();
  const iconColor = theme.muted?.val ?? theme.color?.val ?? "#000000";
  return (
    <XStack
      alignItems="center"
      gap="$3"
      padding="$4"
      borderRadius="$2"
      backgroundColor="$surfaceCard"
      borderWidth={1}
      borderColor="$borderColor"
      pressStyle={{ borderColor: "$borderColorHover" }}
      accessibilityRole="button"
      accessibilityLabel="Detalhes do cartão"
      testID="cards-detail-link"
      onPress={onPress}
    >
      <MaterialCommunityIcons
        name="card-account-details-outline"
        size={iconSizes.md}
        color={iconColor}
      />
      <Paragraph flex={1} fontFamily="$body" fontSize="$4" fontWeight="$6" color="$color">
        Detalhes do cartão
      </Paragraph>
      <MaterialCommunityIcons
        name="chevron-right"
        size={iconSizes.md}
        color={iconColor}
      />
    </XStack>
  );
}

const resolveEyebrow = (
  selectedCardId: string | null,
  cards: readonly CreditCard[],
): string => {
  if (selectedCardId === null) {
    return CONSOLIDATED_EYEBROW;
  }
  return cards.find((card) => card.id === selectedCardId)?.name ?? "Cartão";
};

const noop = (): void => {
  /* placeholder do replay de onboarding (F4) */
};
