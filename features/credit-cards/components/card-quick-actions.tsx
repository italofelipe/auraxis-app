import type { ReactElement } from "react";

import { XStack, YStack, useTheme } from "tamagui";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { AppText } from "@/shared/components/app-text";
import { borderWidths } from "@/config/design-tokens";
import { iconSizes } from "@/shared/theme";

/** Altura mínima do tile — garante alvo de toque ≥44px. */
const TILE_MIN_HEIGHT = 64;

/** Ação rápida individual (ícone + rótulo + handler). */
export interface CardQuickAction {
  /** Chave estável (também usada no testID). */
  readonly key: string;
  /** Ícone MaterialCommunityIcons. */
  readonly icon: keyof typeof MaterialCommunityIcons.glyphMap;
  /** Rótulo curto sob o ícone. */
  readonly label: string;
  /** Handler de toque. */
  readonly onPress: () => void;
}

/** Props da linha de ações rápidas. */
export interface CardQuickActionsProps {
  /** Ações exibidas lado a lado (tipicamente 4). */
  readonly actions: readonly CardQuickAction[];
  readonly testID?: string;
}

function QuickActionTile({ action }: { readonly action: CardQuickAction }): ReactElement {
  const theme = useTheme();
  const iconColor = theme.primary?.val ?? theme.color?.val ?? "#000000";
  return (
    <YStack
      flex={1}
      minHeight={TILE_MIN_HEIGHT}
      paddingVertical="$3"
      paddingHorizontal="$2"
      gap="$2"
      borderRadius="$2"
      borderWidth={borderWidths.hairline}
      borderColor="$borderColor"
      backgroundColor="$surfaceCard"
      alignItems="center"
      justifyContent="center"
      pressStyle={{ backgroundColor: "$surfaceRaised", scale: 0.97 }}
      accessibilityRole="button"
      accessibilityLabel={action.label}
      onPress={action.onPress}
      testID={`card-quick-action-${action.key}`}
    >
      <MaterialCommunityIcons
        name={action.icon}
        size={iconSizes.lg}
        color={iconColor}
      />
      <AppText size="caption" fontWeight="$6" numberOfLines={1}>
        {action.label}
      </AppText>
    </YStack>
  );
}

/**
 * Linha de ações rápidas do detalhe do cartão (Lançar / Fatura / Bloquear /
 * Ajustes): tiles de superfície com ícone de marca e rótulo. Apresentacional —
 * cada ação traz seu próprio handler.
 *
 * @param props Lista de ações.
 * @returns Linha de tiles pressionáveis.
 */
export function CardQuickActions({
  actions,
  testID,
}: CardQuickActionsProps): ReactElement {
  return (
    <XStack gap="$2" testID={testID ?? "card-quick-actions"}>
      {actions.map((action) => (
        <QuickActionTile key={action.key} action={action} />
      ))}
    </XStack>
  );
}
