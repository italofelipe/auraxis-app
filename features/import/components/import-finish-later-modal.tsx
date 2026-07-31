import type { ReactElement } from "react";

import { YStack } from "tamagui";

import { ImportBottomSheet } from "@/features/import/components/import-bottom-sheet";
import { AppButton } from "@/shared/components/app-button";
import { AppHeading } from "@/shared/components/app-heading";
import { useT } from "@/shared/i18n";

export interface ImportFinishLaterModalProps {
  readonly visible: boolean;
  readonly isBusy: boolean;
  readonly onConfirm: () => void;
  readonly onCancel: () => void;
}

/**
 * Segundo modal do "terminar depois": explica o que vai ser gravado com dados
 * genéricos antes de o usuário aceitar. "Prosseguir" confirma com
 * `use_generic_placeholders`; a outra saída volta ao preenchimento.
 *
 * @param props Visibilidade, estado de envio e os dois desfechos.
 * @returns O sheet de confirmação.
 */
export function ImportFinishLaterModal({
  visible,
  isBusy,
  onConfirm,
  onCancel,
}: ImportFinishLaterModalProps): ReactElement {
  const { t } = useT();

  return (
    <ImportBottomSheet
      visible={visible}
      onClose={onCancel}
      closeLabel={t("import.finishLater.cancel")}
      testID="import-finish-later-modal"
    >
      <YStack gap="$4">
        <AppHeading level={3}>{t("import.finishLater.title")}</AppHeading>
        <AppButton
          disabled={isBusy}
          onPress={onConfirm}
          testID="import-finish-later-confirm"
        >
          {t("import.finishLater.confirm")}
        </AppButton>
        <AppButton
          tone="secondary"
          onPress={onCancel}
          testID="import-finish-later-cancel"
        >
          {t("import.finishLater.cancel")}
        </AppButton>
      </YStack>
    </ImportBottomSheet>
  );
}
