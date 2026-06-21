import type { ReactElement } from "react";

import { Paragraph, XStack, YStack } from "tamagui";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import type { InvoiceStatusVM } from "@/features/credit-cards/model/credit-card-invoice";
import { AppGradient } from "@/shared/components/app-gradient";
import { AppMoneyText } from "@/shared/components/app-money-text";
import {
  iconSizes,
  onDarkSurfaceColors,
  type GradientStops,
} from "@/shared/theme";
import { formatCurrency } from "@/shared/utils/formatters";

/** Lado mínimo (px) das setas de navegação de mês — alvo de toque. */
const NAV_BUTTON_SIZE = 44;

/** Props do hero da fatura. */
export interface InvoiceHeroProps {
  /** Gradiente de marca do cartão. */
  readonly gradient: GradientStops;
  /** Rótulo extenso do mês ("junho de 2026"). */
  readonly monthLabel: string;
  /** Total da fatura. */
  readonly total: number;
  /** Pílula de status (Aberta/Fechada), ou null. */
  readonly status: InvoiceStatusVM | null;
  /** Vencimento `DD/MM`, ou null. */
  readonly dueDateLabel: string | null;
  /** Vai para o mês anterior. */
  readonly onPreviousMonth: () => void;
  /** Vai para o mês seguinte. */
  readonly onNextMonth: () => void;
  readonly testID?: string;
}

function NavButton({
  icon,
  accessibilityLabel,
  onPress,
  testID,
}: {
  readonly icon: "chevron-left" | "chevron-right";
  readonly accessibilityLabel: string;
  readonly onPress: () => void;
  readonly testID: string;
}): ReactElement {
  return (
    <YStack
      width={NAV_BUTTON_SIZE}
      height={NAV_BUTTON_SIZE}
      borderRadius="$2"
      alignItems="center"
      justifyContent="center"
      backgroundColor={onDarkSurfaceColors.controlBackground}
      pressStyle={{ backgroundColor: onDarkSurfaceColors.controlBackgroundPressed }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      testID={testID}
    >
      <MaterialCommunityIcons
        name={icon}
        size={iconSizes.md}
        color={onDarkSurfaceColors.text}
      />
    </YStack>
  );
}

function MonthNav({
  monthLabel,
  onPreviousMonth,
  onNextMonth,
}: {
  readonly monthLabel: string;
  readonly onPreviousMonth: () => void;
  readonly onNextMonth: () => void;
}): ReactElement {
  return (
    <XStack alignItems="center" justifyContent="space-between" gap="$3">
      <NavButton
        icon="chevron-left"
        accessibilityLabel="Mês anterior"
        onPress={onPreviousMonth}
        testID="invoice-hero-prev"
      />
      <YStack flex={1} alignItems="center" gap="$1">
        <Paragraph
          fontFamily="$body"
          fontSize="$1"
          fontWeight="$7"
          letterSpacing={1}
          textTransform="uppercase"
          color={onDarkSurfaceColors.textSubtle}
        >
          Fatura de
        </Paragraph>
        <Paragraph
          fontFamily="$heading"
          fontSize="$5"
          fontWeight="$7"
          textTransform="capitalize"
          color={onDarkSurfaceColors.text}
          numberOfLines={1}
        >
          {monthLabel}
        </Paragraph>
      </YStack>
      <NavButton
        icon="chevron-right"
        accessibilityLabel="Próximo mês"
        onPress={onNextMonth}
        testID="invoice-hero-next"
      />
    </XStack>
  );
}

function HeroFooter({
  status,
  dueDateLabel,
}: {
  readonly status: InvoiceStatusVM | null;
  readonly dueDateLabel: string | null;
}): ReactElement {
  return (
    <XStack alignItems="center" justifyContent="center" gap="$2">
      {status ? (
        <Paragraph
          fontFamily="$body"
          fontSize="$2"
          fontWeight="$7"
          paddingHorizontal="$3"
          paddingVertical="$1"
          borderRadius="$5"
          backgroundColor={onDarkSurfaceColors.controlBackground}
          color={onDarkSurfaceColors.text}
        >
          {status.label}
        </Paragraph>
      ) : null}
      {dueDateLabel ? (
        <Paragraph
          fontFamily="$body"
          fontSize="$3"
          color={onDarkSurfaceColors.textMuted}
        >
          {`vence dia ${dueDateLabel}`}
        </Paragraph>
      ) : null}
    </XStack>
  );
}

/**
 * Hero da tela "Detalhe da fatura": gradiente de marca com setas de navegação de
 * mês, overline "FATURA DE", o mês, o total em mono grande e uma linha com a
 * pílula de status e o vencimento. Todo o conteúdo usa cores de superfície
 * escura (independe do tema). Apresentacional.
 *
 * @param props Gradiente, mês, total, status, vencimento e navegação.
 * @returns Hero da fatura.
 */
export function InvoiceHero({
  gradient,
  monthLabel,
  total,
  status,
  dueDateLabel,
  onPreviousMonth,
  onNextMonth,
  testID,
}: InvoiceHeroProps): ReactElement {
  return (
    <AppGradient gradient={gradient} borderRadius="$3" testID={testID ?? "invoice-hero"}>
      <YStack padding="$5" gap="$3">
        <MonthNav
          monthLabel={monthLabel}
          onPreviousMonth={onPreviousMonth}
          onNextMonth={onNextMonth}
        />
        <AppMoneyText
          fontSize="$9"
          fontWeight="$6"
          textAlign="center"
          color={onDarkSurfaceColors.text}
        >
          {formatCurrency(total)}
        </AppMoneyText>
        <HeroFooter status={status} dueDateLabel={dueDateLabel} />
      </YStack>
    </AppGradient>
  );
}
