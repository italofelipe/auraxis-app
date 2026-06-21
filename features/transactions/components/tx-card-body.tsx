import type { ReactElement } from "react";

import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable } from "react-native";
import { Paragraph, XStack, YStack, useTheme } from "tamagui";

import type { TransactionFeedItem } from "@/features/transactions/model/transactions-feed";
import {
  TxCategoryChip,
  TxInvoiceChip,
  TxStatusChip,
} from "@/features/transactions/components/tx-chips";
import { AppMoneyText } from "@/shared/components/app-money-text";
import { AppText } from "@/shared/components/app-text";
import { colorPalette, iconSizes } from "@/shared/theme";

/** Largura de cada ação revelada no swipe (px). */
const ACTION_WIDTH = 84;
/** Largura do trilho de cor da categoria na borda esquerda (px). */
const RAIL_WIDTH = 4;

/** Props de um botão de ação revelado ao arrastar o card. */
export interface SwipeActionProps {
  readonly label: string;
  readonly icon: keyof typeof MaterialCommunityIcons.glyphMap;
  readonly backgroundColor: string;
  readonly accessibilityLabel: string;
  readonly onPress: () => void;
}

/** Botão de ação revelado ao arrastar o card. */
export function SwipeAction({
  label,
  icon,
  backgroundColor,
  accessibilityLabel,
  onPress,
}: SwipeActionProps): ReactElement {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={{
        width: ACTION_WIDTH,
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
        backgroundColor,
      }}
    >
      <MaterialCommunityIcons name={icon} size={22} color={colorPalette.white} />
      <Paragraph color={colorPalette.white} fontFamily="$body" fontSize="$2" fontWeight="$6">
        {label}
      </Paragraph>
    </Pressable>
  );
}

/** Rodapé extra do modo Analítico: categoria, pílulas e % do fluxo. */
function AnalyticFooter({ item }: { readonly item: TransactionFeedItem }): ReactElement {
  const flowLabel = item.type === "income" ? "do total" : "do gasto";
  return (
    <XStack alignItems="center" flexWrap="wrap" gap="$2" marginTop="$1">
      <XStack alignItems="center" gap="$1">
        <YStack width={8} height={8} borderRadius="$1" backgroundColor={item.categoryColor} />
        <AppText size="caption" tone="muted" numberOfLines={1}>
          {item.categoryName}
        </AppText>
      </XStack>
      {item.isRecurring ? (
        <Paragraph
          fontFamily="$body"
          fontWeight="$7"
          fontSize="$1"
          color="$primary"
          backgroundColor="$primarySubtle"
          paddingHorizontal="$2"
          paddingVertical="$1"
          borderRadius="$5"
        >
          Recorrente
        </Paragraph>
      ) : null}
      {item.isInstallment ? (
        <Paragraph
          fontFamily="$body"
          fontWeight="$7"
          fontSize="$1"
          color="$warning"
          paddingHorizontal="$2"
          paddingVertical="$1"
          borderRadius="$5"
          borderColor="$warning"
          borderWidth={1}
        >
          Fixa
        </Paragraph>
      ) : null}
      <AppText size="caption" tone="muted" marginLeft="auto">
        {`${item.percentOfFlow}% ${flowLabel}`}
      </AppText>
    </XStack>
  );
}

/** Props do conteúdo visível do card. */
export interface TxCardBodyProps {
  readonly item: TransactionFeedItem;
  readonly analytic: boolean;
}

/**
 * Conteúdo visível do card de transação: trilho de cor da categoria, chip de
 * ícone, título + valor assinado (verde p/ receita, tinta p/ despesa),
 * descrição (1 linha) e rodapé com status + data; no modo Analítico ganha o
 * rodapé extra. Apresentacional — o swipe/press vive em `TxCard`.
 *
 * @param props Item do feed e flag de modo analítico.
 * @returns Corpo do card.
 */
export function TxCardBody({ item, analytic }: TxCardBodyProps): ReactElement {
  const theme = useTheme();
  const mutedColor = theme.muted?.val ?? theme.color?.val ?? "#000000";
  return (
    <XStack
      backgroundColor="$surfaceCard"
      borderColor="$borderColor"
      borderWidth={1}
      borderRadius="$2"
      padding="$3"
      gap="$3"
      overflow="hidden"
    >
      <YStack
        position="absolute"
        top={0}
        left={0}
        bottom={0}
        width={RAIL_WIDTH}
        backgroundColor={item.categoryColor}
      />
      <TxCategoryChip color={item.categoryColor} icon={item.categoryIcon} name={item.categoryName} />
      <YStack flex={1} gap="$1">
        <XStack alignItems="flex-start" justifyContent="space-between" gap="$2">
          <Paragraph
            flex={1}
            numberOfLines={1}
            color="$color"
            fontFamily="$body"
            fontWeight="$7"
            fontSize="$4"
          >
            {item.title}
          </Paragraph>
          <AppMoneyText
            fontSize="$4"
            fontWeight="$7"
            color={item.type === "income" ? "$success" : "$color"}
          >
            {item.signedDisplay}
          </AppMoneyText>
        </XStack>
        {item.description ? (
          <AppText size="bodySm" tone="muted" numberOfLines={1}>
            {item.description}
          </AppText>
        ) : null}
        <XStack alignItems="center" gap="$2" flexWrap="wrap">
          <TxStatusChip status={item.status} type={item.type} />
          {item.invoiceBadgeMonth ? (
            <TxInvoiceChip month={item.invoiceBadgeMonth} />
          ) : null}
          <XStack alignItems="center" gap="$1">
            <MaterialCommunityIcons
              name="calendar-blank-outline"
              size={iconSizes.xs}
              color={mutedColor}
            />
            <AppText size="caption" tone="muted">
              {item.dateDisplay}
            </AppText>
          </XStack>
        </XStack>
        {analytic ? <AnalyticFooter item={item} /> : null}
      </YStack>
    </XStack>
  );
}
