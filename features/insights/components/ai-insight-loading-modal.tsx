import type { ReactElement } from "react";

import { Modal } from "react-native";
import { YStack } from "tamagui";

import { AsyncStateNotice } from "@/shared/components/async-state-notice";

export interface AiInsightLoadingModalProps {
  readonly visible: boolean;
}

export function AiInsightLoadingModal({
  visible,
}: AiInsightLoadingModalProps): ReactElement {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <YStack
        flex={1}
        alignItems="center"
        justifyContent="center"
        padding="$4"
        backgroundColor="rgba(0,0,0,0.42)"
      >
        <AsyncStateNotice
          kind="loading"
          title="Gerando insights"
          description="A IA esta cruzando seu contexto financeiro mais recente."
        />
      </YStack>
    </Modal>
  );
}
