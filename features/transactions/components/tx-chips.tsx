import type { ReactElement } from "react";

import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Paragraph, XStack, YStack, useTheme } from "tamagui";

import type { TransactionType } from "@/features/transactions/contracts";
import { resolveCategoryIcon } from "@/features/transactions/utils/category-icon";
import {
  formatStatusLabelForType,
  statusVisual,
  type StatusVisualTone,
} from "@/features/transactions/utils/transaction-presentation";
import { iconSizes } from "@/shared/theme";

/** Fundo do chip de categoria como fração de opacidade da cor da categoria. */
const CATEGORY_CHIP_BG_OPACITY = 0.13;

/** Resolve a cor concreta de um tom de status a partir do tema atual. */
const useStatusToneColor = (tone: StatusVisualTone): string => {
  const theme = useTheme();
  const fallback = theme.color?.val ?? "#000000";
  const byTone: Record<StatusVisualTone, string | undefined> = {
    success: theme.success?.val,
    warning: theme.warning?.val,
    danger: theme.danger?.val,
    neutral: theme.muted?.val,
  };
  return byTone[tone] ?? fallback;
};

/** Props do chip de status do feed. */
export interface TxStatusChipProps {
  /** Estado cru da transação (inglês, vindo da API). */
  readonly status: string;
  /** Tipo da transação (define "Pago" vs "Recebido"). */
  readonly type: TransactionType;
}

/**
 * Chip de status (feed redesenhado): ícone + rótulo pt-BR sobre um fundo na cor
 * semântica do estado (sucesso/atenção/perigo/neutro) com baixa opacidade. As
 * cores vêm do tema resolvido — sem hex no `.tsx`.
 *
 * @param props Estado e tipo da transação.
 * @returns Chip de status colorido.
 */
export function TxStatusChip({ status, type }: TxStatusChipProps): ReactElement {
  const visual = statusVisual(status);
  const toneColor = useStatusToneColor(visual.tone);
  const label = formatStatusLabelForType(status, type);

  return (
    <XStack
      alignItems="center"
      gap="$1"
      paddingHorizontal="$2"
      paddingVertical="$1"
      borderRadius="$5"
      overflow="hidden"
      testID={`tx-status-chip-${status}`}
    >
      <YStack
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        backgroundColor={toneColor}
        opacity={0.14}
      />
      <MaterialCommunityIcons
        name={visual.icon as keyof typeof MaterialCommunityIcons.glyphMap}
        size={iconSizes.xs}
        color={toneColor}
      />
      <Paragraph fontFamily="$body" fontWeight="$7" fontSize="$1" color={toneColor}>
        {label}
      </Paragraph>
    </XStack>
  );
}

/** Props do chip de categoria (ícone sobre fundo colorido). */
export interface TxCategoryChipProps {
  /** Cor hexadecimal resolvida da categoria. */
  readonly color: string;
  /** Nome de ícone cru da Tag (ou null). */
  readonly icon: string | null;
  /** Nome da categoria (usado para inferir o ícone e a acessibilidade). */
  readonly name: string;
  /** Lado do chip em px (default 46, conforme o design). */
  readonly size?: number;
}

/** Lado padrão do chip de categoria (design). */
const DEFAULT_CHIP_SIZE = 46;

/**
 * Chip arredondado da categoria: um quadrado na cor da categoria com baixa
 * opacidade, com o ícone da categoria centralizado em cor cheia por cima
 * (padrão de "cor + alpha" dos Cartões, sem computar rgba). Geometria em px é
 * permitida pela governança (não é token de estilo de tema).
 *
 * @param props Cor, ícone, nome e tamanho do chip.
 * @returns Chip de ícone da categoria.
 */
export function TxCategoryChip({
  color,
  icon,
  name,
  size = DEFAULT_CHIP_SIZE,
}: TxCategoryChipProps): ReactElement {
  const glyph = resolveCategoryIcon(icon, name);
  return (
    <YStack
      width={size}
      height={size}
      borderRadius="$2"
      alignItems="center"
      justifyContent="center"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <YStack
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        borderRadius="$2"
        backgroundColor={color}
        opacity={CATEGORY_CHIP_BG_OPACITY}
      />
      <MaterialCommunityIcons
        name={glyph as keyof typeof MaterialCommunityIcons.glyphMap}
        size={size * 0.46}
        color={color}
      />
    </YStack>
  );
}
