import { memo, type ReactElement } from "react";

import { Pressable, type AccessibilityActionEvent } from "react-native";
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import { XStack } from "tamagui";

import { useResolvedTheme } from "@/core/shell/use-resolved-theme";
import { SwipeAction, TxCardBody } from "@/features/transactions/components/tx-card-body";
import type { TransactionFeedItem } from "@/features/transactions/model/transactions-feed";
import { darkSemanticColors, lightSemanticColors } from "@/shared/theme";

/** Props do card de transação do feed. */
export interface TxCardProps {
  /** View-model do item do feed. */
  readonly item: TransactionFeedItem;
  /** True no modo Analítico (mostra rodapé extra). */
  readonly analytic: boolean;
  /** Abre o action sheet / detalhe ao tocar no card. */
  readonly onPress: (id: string) => void;
  /** Marca como pago (swipe / acessibilidade). */
  readonly onMarkPaid: (id: string) => void;
  /** Exclui (swipe / acessibilidade). */
  readonly onDelete: (id: string) => void;
}

/**
 * Card de transação do feed (variação "Feed" do design). Tocar abre o action
 * sheet (ou edição) via `onPress`; arrastar para a esquerda revela
 * Pagar/Excluir — preservando os fluxos existentes. As ações também ficam
 * acessíveis ao leitor de tela via `accessibilityActions`. O visual do card
 * vive em `TxCardBody`.
 *
 * @param props Item, modo analítico e handlers de tap/pagar/excluir.
 * @returns Card swipeable e pressionável.
 */
function TxCardComponent({
  item,
  analytic,
  onPress,
  onMarkPaid,
  onDelete,
}: TxCardProps): ReactElement {
  const isDark = useResolvedTheme() === "auraxis_dark";
  const palette = isDark ? darkSemanticColors : lightSemanticColors;
  const canPay = item.status !== "paid";

  const handleAccessibilityAction = (event: AccessibilityActionEvent): void => {
    if (event.nativeEvent.actionName === "pay") {
      onMarkPaid(item.id);
    } else if (event.nativeEvent.actionName === "delete") {
      onDelete(item.id);
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
              accessibilityLabel={`Pagar ${item.title}`}
              onPress={() => {
                methods.close();
                onMarkPaid(item.id);
              }}
            />
          ) : null}
          <SwipeAction
            label="Excluir"
            icon="trash-can-outline"
            backgroundColor={palette.danger}
            accessibilityLabel={`Excluir ${item.title}`}
            onPress={() => {
              methods.close();
              onDelete(item.id);
            }}
          />
        </XStack>
      )}
    >
      <Pressable
        testID={`tx-card-${item.id}`}
        accessibilityRole="button"
        accessibilityLabel={`${item.title}, ${item.signedDisplay}, ${item.categoryName}. Toque para ações.`}
        accessibilityActions={[
          ...(canPay ? [{ name: "pay", label: "Pagar" }] : []),
          { name: "delete", label: "Excluir" },
        ]}
        onAccessibilityAction={handleAccessibilityAction}
        onPress={() => onPress(item.id)}
      >
        <TxCardBody item={item} analytic={analytic} />
      </Pressable>
    </ReanimatedSwipeable>
  );
}

export const TxCard = memo(TxCardComponent);
