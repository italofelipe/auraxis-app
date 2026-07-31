import type { ReactElement, ReactNode } from "react";

import { Modal, Pressable } from "react-native";
import { YStack } from "tamagui";

// Mesmo padrão do sheet de transações: `Modal` do RN em vez de lib nativa de
// bottom-sheet, para o fluxo continuar 100% publicável por OTA (#749).
const SHEET_BACKDROP = "rgba(0,0,0,0.45)";
const SHEET_RADIUS = 24;

export interface ImportBottomSheetProps {
  readonly visible: boolean;
  readonly onClose: () => void;
  readonly children: ReactNode;
  readonly closeLabel: string;
  readonly testID?: string;
}

/**
 * Bottom sheet da feature de import: sobe de baixo, fecha ao tocar no backdrop
 * e no botão de voltar do Android.
 *
 * @param props Visibilidade, callback de fechamento e conteúdo.
 * @returns Sheet com o conteúdo recebido.
 */
export function ImportBottomSheet({
  visible,
  onClose,
  children,
  closeLabel,
  testID,
}: ImportBottomSheetProps): ReactElement {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        style={{ flex: 1 }}
        accessibilityRole="button"
        accessibilityLabel={closeLabel}
        onPress={onClose}
      >
        <YStack flex={1} backgroundColor={SHEET_BACKDROP} justifyContent="flex-end">
          {/* Pressable interno absorve o toque para não fechar no conteúdo. */}
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
