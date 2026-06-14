import { memo, type ReactElement } from "react";

import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, type AccessibilityActionEvent } from "react-native";
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import { Paragraph, XStack, YStack } from "tamagui";

import { useResolvedTheme } from "@/core/shell/use-resolved-theme";
import type { TransactionViewModel } from "@/features/transactions/hooks/use-transactions-screen-controller";
import {
  formatStatusLabel,
  getInstallmentLabel,
  statusTone,
} from "@/features/transactions/utils/transaction-presentation";
import { colorPalette, darkSemanticColors, lightSemanticColors } from "@/shared/theme";
import { AppBadge } from "@/shared/components/app-badge";
import { formatShortDate } from "@/shared/utils/formatters";

const ACTION_WIDTH = 84;

export interface TransactionRowProps {
  readonly tx: TransactionViewModel;
  readonly onOpenActions: (tx: TransactionViewModel) => void;
  readonly onMarkPaid: (txId: string) => void;
  readonly onDelete: (txId: string) => void;
}

interface SwipeActionProps {
  readonly label: string;
  readonly icon: keyof typeof MaterialCommunityIcons.glyphMap;
  readonly backgroundColor: string;
  readonly accessibilityLabel: string;
  readonly onPress: () => void;
}

function SwipeAction({
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

interface RowContentProps {
  readonly tx: TransactionViewModel;
}

/** Conteúdo visível da linha: título/descrição à esquerda, valor/status à direita. */
function RowContent({ tx }: RowContentProps): ReactElement {
  const installmentLabel = getInstallmentLabel(tx);
  const secondaryLine =
    tx.description ?? `Vence ${formatShortDate(tx.dueDate)}`;
  return (
    <XStack
      backgroundColor="$surfaceCard"
      paddingVertical="$3"
      paddingHorizontal="$4"
      gap="$3"
      alignItems="center"
    >
      <YStack flex={1} gap="$1">
        <Paragraph
          numberOfLines={1}
          color="$color"
          fontFamily="$body"
          fontSize="$4"
          fontWeight="$6"
        >
          {tx.title}
        </Paragraph>
        <Paragraph numberOfLines={1} color="$muted" fontFamily="$body" fontSize="$2">
          {secondaryLine}
          {installmentLabel ? ` · ${installmentLabel}` : ""}
        </Paragraph>
      </YStack>
      <YStack alignItems="flex-end" gap="$1">
        <Paragraph
          color={tx.type === "income" ? "$success" : "$danger"}
          fontFamily="$body"
          fontSize="$4"
          fontWeight="$6"
        >
          {tx.type === "income" ? "+" : "-"}
          {tx.amount}
        </Paragraph>
        <AppBadge tone={statusTone(tx.status)}>{formatStatusLabel(tx.status)}</AppBadge>
      </YStack>
    </XStack>
  );
}

/**
 * Linha compacta de transação (paridade web — épico #540 / #569). Toque
 * abre o action sheet com todas as ações; arrastar para a esquerda revela
 * Pagar/Excluir. As ações também ficam disponíveis ao leitor de tela via
 * `accessibilityActions`. Pagar/Excluir reusam os fluxos de confirmação.
 */
function TransactionRowComponent({
  tx,
  onOpenActions,
  onMarkPaid,
  onDelete,
}: TransactionRowProps): ReactElement {
  const isDark = useResolvedTheme() === "auraxis_dark";
  const palette = isDark ? darkSemanticColors : lightSemanticColors;
  const canPay = tx.status !== "paid";

  const handleAccessibilityAction = (event: AccessibilityActionEvent): void => {
    if (event.nativeEvent.actionName === "pay") {
      onMarkPaid(tx.id);
    } else if (event.nativeEvent.actionName === "delete") {
      onDelete(tx.id);
    }
  };

  return (
    <ReanimatedSwipeable
      friction={1.6}
      rightThreshold={40}
      overshootRight={false}
      renderRightActions={(_progress, _translation, methods) => (
        <XStack>
          {canPay ? (
            <SwipeAction
              label="Pagar"
              icon="check"
              backgroundColor={palette.success}
              accessibilityLabel={`Pagar ${tx.title}`}
              onPress={() => {
                methods.close();
                onMarkPaid(tx.id);
              }}
            />
          ) : null}
          <SwipeAction
            label="Excluir"
            icon="trash-can-outline"
            backgroundColor={palette.danger}
            accessibilityLabel={`Excluir ${tx.title}`}
            onPress={() => {
              methods.close();
              onDelete(tx.id);
            }}
          />
        </XStack>
      )}
    >
      <Pressable
        testID={`transaction-row-${tx.id}`}
        accessibilityRole="button"
        accessibilityLabel={`${tx.title}, ${formatStatusLabel(tx.status)}, ${
          tx.type === "income" ? "receita" : "despesa"
        } de ${tx.amount}, vence ${formatShortDate(tx.dueDate)}. Toque para ações.`}
        accessibilityActions={[
          ...(canPay ? [{ name: "pay", label: "Pagar" }] : []),
          { name: "delete", label: "Excluir" },
        ]}
        onAccessibilityAction={handleAccessibilityAction}
        onPress={() => onOpenActions(tx)}
      >
        <RowContent tx={tx} />
      </Pressable>
    </ReanimatedSwipeable>
  );
}

export const TransactionRow = memo(TransactionRowComponent);
