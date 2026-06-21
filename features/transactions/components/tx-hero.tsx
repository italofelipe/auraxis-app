import type { ReactElement } from "react";

import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Paragraph, XStack, YStack } from "tamagui";

import { useResolvedTheme } from "@/core/shell/use-resolved-theme";
import { AppGradient } from "@/shared/components/app-gradient";
import { AppMoneyText } from "@/shared/components/app-money-text";
import type { FeedKpis } from "@/features/transactions/model/transactions-feed";
import {
  darkSemanticGradients,
  iconSizes,
  lightSemanticGradients,
  onDarkSurfaceColors,
} from "@/shared/theme";
import {
  formatCurrencyShort,
  formatCurrencySigned,
} from "@/shared/utils/formatters";

/** Props do herói teal da tela de Transações. */
export interface TxHeroProps {
  /** Rótulo do período (ex.: "Junho de 2026"). */
  readonly periodLabel: string;
  /** KPIs agregados do período (receitas, despesas, resultado, contagem). */
  readonly kpis: FeedKpis;
  /** True quando o tema resolvido é escuro (controla o ícone do botão). */
  readonly isDark: boolean;
  /** Alterna o tema claro/escuro. */
  readonly onToggleTheme: () => void;
  /** Alterna entre lista e calendário. */
  readonly onToggleCalendar: () => void;
  /** True quando a visão de calendário está ativa (controla ícone/label). */
  readonly calendarActive: boolean;
}

interface HeroRoundButtonProps {
  readonly icon: keyof typeof MaterialCommunityIcons.glyphMap;
  readonly accessibilityLabel: string;
  readonly onPress: () => void;
  readonly testID?: string;
}

/** Botão redondo translúcido (44×44) sobre o hero. */
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
      pressStyle={{
        backgroundColor: onDarkSurfaceColors.controlBackgroundPressed,
      }}
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

interface FlowShortProps {
  readonly icon: keyof typeof MaterialCommunityIcons.glyphMap;
  readonly color: string;
  readonly value: string;
}

/** Linha curta de fluxo (↑ receitas / ↓ despesas) no canto do hero. */
function FlowShort({ icon, color, value }: FlowShortProps): ReactElement {
  return (
    <XStack alignItems="center" gap="$1" justifyContent="flex-end">
      <MaterialCommunityIcons name={icon} size={iconSizes.xs} color={color} />
      <AppMoneyText fontSize="$3" color={color}>
        {value}
      </AppMoneyText>
    </XStack>
  );
}

/** Linha do RESULTADO (mono assinado) + fluxos curtos (↑ receitas / ↓ despesas). */
function HeroResultRow({ kpis }: { readonly kpis: FeedKpis }): ReactElement {
  const resultColor =
    kpis.result >= 0 ? onDarkSurfaceColors.positive : onDarkSurfaceColors.negative;
  return (
    <XStack alignItems="flex-end" justifyContent="space-between" gap="$3">
      <YStack flex={1} gap="$1">
        <Paragraph
          fontFamily="$body"
          fontWeight="$7"
          fontSize="$1"
          letterSpacing={1}
          color={onDarkSurfaceColors.textSubtle}
        >
          RESULTADO
        </Paragraph>
        <AppMoneyText
          fontSize="$9"
          fontWeight="$7"
          color={resultColor}
          testID="tx-hero-result"
        >
          {formatCurrencySigned(kpis.result)}
        </AppMoneyText>
      </YStack>
      <YStack gap="$1">
        <FlowShort
          icon="arrow-up"
          color={onDarkSurfaceColors.positive}
          value={formatCurrencyShort(kpis.income)}
        />
        <FlowShort
          icon="arrow-down"
          color={onDarkSurfaceColors.negative}
          value={formatCurrencyShort(kpis.expense)}
        />
      </YStack>
    </XStack>
  );
}

/**
 * Herói teal da tela de Transações: título, período + nº de lançamentos,
 * RESULTADO (mono assinado, verde/vermelho) e, à direita, os fluxos curtos
 * (↑ receitas / ↓ despesas). Inclui os botões de alternar tema e calendário.
 * O gradiente segue o tema resolvido (mesmo padrão dos Cartões).
 *
 * @param props Período, KPIs, estado de tema/calendário e handlers.
 * @returns Cabeçalho em gradiente.
 */
export function TxHero({
  periodLabel,
  kpis,
  isDark,
  onToggleTheme,
  onToggleCalendar,
  calendarActive,
}: TxHeroProps): ReactElement {
  const resolvedTheme = useResolvedTheme();
  const heroGradient =
    resolvedTheme === "auraxis_dark"
      ? darkSemanticGradients.hero
      : lightSemanticGradients.hero;
  const subtitle = `${periodLabel} · ${kpis.count} lançamentos`;

  return (
    <AppGradient gradient={heroGradient} borderRadius="$3" testID="tx-hero">
      <YStack padding="$5" gap="$4">
        <XStack justifyContent="space-between" alignItems="flex-start" gap="$3">
          <YStack flex={1} gap="$1">
            <Paragraph
              fontFamily="$heading"
              fontWeight="$7"
              fontSize="$8"
              color={onDarkSurfaceColors.text}
            >
              Transações
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
              icon={calendarActive ? "format-list-bulleted" : "calendar-month-outline"}
              accessibilityLabel={calendarActive ? "Ver lista" : "Ver calendário"}
              testID="tx-hero-calendar-toggle"
              onPress={onToggleCalendar}
            />
            <HeroRoundButton
              icon={isDark ? "white-balance-sunny" : "weather-night"}
              accessibilityLabel="Alternar tema"
              testID="tx-hero-theme-toggle"
              onPress={onToggleTheme}
            />
          </XStack>
        </XStack>
        <HeroResultRow kpis={kpis} />
      </YStack>
    </AppGradient>
  );
}
