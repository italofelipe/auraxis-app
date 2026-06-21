import type { ReactElement, ReactNode } from "react";

import { XStack, YStack, useTheme } from "tamagui";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { AppHeading } from "@/shared/components/app-heading";
import { AppText } from "@/shared/components/app-text";
import { borderWidths } from "@/config/design-tokens";
import { iconSizes } from "@/shared/theme";

/** Lado mínimo (px) do botão redondo da AppBar — alvo de toque ≥44px. */
const APP_BAR_BUTTON_SIZE = 44;

/** Props da AppBar das telas de detalhe de cartão/fatura. */
export interface CardAppBarProps {
  /** Título principal (nome do cartão ou "Fatura"). */
  readonly title: string;
  /** Subtítulo opcional ("{emissor} · {bandeira}" ou nome do cartão). */
  readonly subtitle?: string | null;
  /** Handler do botão voltar. */
  readonly onBack: () => void;
  /** Conteúdo opcional à direita (ex.: menu de três pontos). */
  readonly right?: ReactNode;
  readonly testID?: string;
}

/** Botão redondo de superfície da AppBar (voltar / menu). */
export interface CardAppBarButtonProps {
  readonly icon: keyof typeof MaterialCommunityIcons.glyphMap;
  readonly accessibilityLabel: string;
  readonly onPress: () => void;
  readonly testID?: string;
}

/**
 * Botão redondo de superfície reutilizado na AppBar (voltar e menu). Mantém o
 * alvo de toque mínimo de 44px e usa cor de ícone resolvida do tema.
 *
 * @param props Ícone, rótulo de acessibilidade e handler.
 * @returns Botão redondo pressionável.
 */
export function CardAppBarButton({
  icon,
  accessibilityLabel,
  onPress,
  testID,
}: CardAppBarButtonProps): ReactElement {
  const theme = useTheme();
  const iconColor = theme.color?.val ?? "#000000";
  return (
    <YStack
      width={APP_BAR_BUTTON_SIZE}
      height={APP_BAR_BUTTON_SIZE}
      borderRadius="$5"
      borderWidth={borderWidths.hairline}
      borderColor="$borderColor"
      backgroundColor="$surfaceCard"
      alignItems="center"
      justifyContent="center"
      pressStyle={{ backgroundColor: "$surfaceRaised", scale: 0.96 }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      testID={testID}
    >
      <MaterialCommunityIcons name={icon} size={iconSizes.md} color={iconColor} />
    </YStack>
  );
}

/**
 * AppBar das telas de detalhe (cartão/fatura): botão voltar, título + subtítulo
 * truncados e um slot opcional à direita. Espelha a AppBar do handoff (botões
 * redondos de superfície sobre o fundo da página).
 *
 * @param props Título, subtítulo, handler de voltar e slot direito.
 * @returns Cabeçalho da tela de detalhe.
 */
export function CardAppBar({
  title,
  subtitle,
  onBack,
  right,
  testID,
}: CardAppBarProps): ReactElement {
  return (
    <XStack alignItems="center" gap="$3" testID={testID ?? "card-app-bar"}>
      <CardAppBarButton
        icon="chevron-left"
        accessibilityLabel="Voltar"
        onPress={onBack}
        testID="card-app-bar-back"
      />
      <YStack flex={1} gap="$1">
        <AppHeading level={3} fontSize="$7" numberOfLines={1}>
          {title}
        </AppHeading>
        {subtitle ? (
          <AppText size="bodySm" tone="muted" numberOfLines={1}>
            {subtitle}
          </AppText>
        ) : null}
      </YStack>
      {right}
    </XStack>
  );
}
