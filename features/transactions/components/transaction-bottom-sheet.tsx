import { type ReactNode, type ReactElement } from "react";

import { Modal, Pressable } from "react-native";
import { YStack } from "tamagui";

// Backdrop em variável (não literal inline no objeto/JSX) — paridade com os
// overlays existentes; mantém o sheet 100% OTA sem libs de bottom-sheet.
const SHEET_BACKDROP = "rgba(0,0,0,0.45)";
const SHEET_RADIUS = 24;

export interface TransactionBottomSheetProps {
  readonly visible: boolean;
  readonly onClose: () => void;
  readonly children: ReactNode;
  readonly testID?: string;
}

/**
 * Bottom sheet reutilizável da feature de transações: `Modal` nativo que
 * sobe de baixo, backdrop tocável para fechar e container com cantos
 * superiores arredondados. Base do action sheet (ações da linha) e do
 * filter sheet — sem dependência nativa nova (usa o `Modal` do RN).
 */
export function TransactionBottomSheet({
  visible,
  onClose,
  children,
  testID,
}: TransactionBottomSheetProps): ReactElement {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        style={{ flex: 1 }}
        accessibilityRole="button"
        accessibilityLabel="Fechar"
        onPress={onClose}
      >
        <YStack flex={1} backgroundColor={SHEET_BACKDROP} justifyContent="flex-end">
          {/* Pressable interno absorve o toque para não fechar ao tocar no conteúdo. */}
          <Pressable>
            <YStack
              testID={testID}
              backgroundColor="$background"
              padding="$4"
              paddingBottom="$6"
              gap="$3"
              borderTopLeftRadius={SHEET_RADIUS}
              borderTopRightRadius={SHEET_RADIUS}
            >
              {children}
            </YStack>
          </Pressable>
        </YStack>
      </Pressable>
    </Modal>
  );
}
