import type { ReactElement } from "react";

import { Paragraph, YStack } from "tamagui";

import {
  useDangerZoneScreenController,
  type DangerZoneScreenController,
} from "@/features/user-profile/hooks/use-danger-zone-screen-controller";
import { AppButton } from "@/shared/components/app-button";
import { AppErrorNotice } from "@/shared/components/app-error-notice";
import { AppFormMessage } from "@/shared/components/app-form-message";
import { AppInputField } from "@/shared/components/app-input-field";
import { AppScreen } from "@/shared/components/app-screen";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";
import { AppToggleRow } from "@/shared/components/app-toggle-row";

const CONFIRM_PHRASE = "EXCLUIR";

/**
 * Irreversible "Delete account" surface. Walks the user through three
 * deliberate guards (consent toggle, literal confirmation phrase and
 * password) before unlocking the destructive action.
 */
export function DangerZoneScreen(): ReactElement {
  const controller = useDangerZoneScreenController();
  return (
    <AppScreen>
      <WarningCard />
      <ConfirmationCard controller={controller} />
      <ActionCard controller={controller} />
    </AppScreen>
  );
}

function WarningCard(): ReactElement {
  return (
    <AppSurfaceCard
      title="Excluir conta"
      description="Esta ação é permanente e irreversível."
    >
      <YStack gap="$3">
        <Paragraph color="$color" fontFamily="$body" fontSize="$4">
          Ao excluir sua conta, todos os seus dados serão anonimizados e removidos
          do Auraxis: transações, metas, carteira, orçamentos, ferramentas e
          configurações.
        </Paragraph>
        <Paragraph color="$muted" fontFamily="$body" fontSize="$3">
          Conformidade LGPD: a exclusão é registrada e seu acesso é encerrado
          imediatamente após a confirmação.
        </Paragraph>
      </YStack>
    </AppSurfaceCard>
  );
}

interface ControllerProps {
  readonly controller: DangerZoneScreenController;
}

function ConfirmationCard({ controller }: ControllerProps): ReactElement {
  return (
    <AppSurfaceCard
      title="Confirmação"
      description={`Para prosseguir, preencha as três etapas abaixo. Digite ${CONFIRM_PHRASE} exatamente como mostrado.`}
    >
      <YStack gap="$4">
        <AppToggleRow
          label="Entendo as consequências"
          description="Reconheço que esta ação não pode ser desfeita."
          checked={controller.consent}
          onCheckedChange={controller.handleConsentChange}
          testID="danger-zone-consent"
        />
        <AppInputField
          id="danger-zone-confirm-phrase"
          label={`Digite "${CONFIRM_PHRASE}"`}
          placeholder={CONFIRM_PHRASE}
          autoCapitalize="characters"
          autoCorrect={false}
          value={controller.confirmPhrase}
          onChangeText={controller.handleConfirmPhraseChange}
          helperText={
            controller.confirmPhrase.length > 0 &&
            controller.confirmPhrase !== CONFIRM_PHRASE
              ? "A palavra precisa coincidir exatamente, em maiúsculas."
              : undefined
          }
        />
        <AppInputField
          id="danger-zone-password"
          label="Sua senha atual"
          placeholder="•••••••••"
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry
          value={controller.password}
          onChangeText={controller.handlePasswordChange}
        />
      </YStack>
    </AppSurfaceCard>
  );
}

function ActionCard({ controller }: ControllerProps): ReactElement {
  return (
    <AppSurfaceCard title="Ação" description="Pronto para excluir?">
      <YStack gap="$3">
        <AppButton
          tone="danger"
          onPress={() => {
            void controller.handleSubmit();
          }}
          disabled={!controller.canSubmit || controller.isDeleting}
          testID="danger-zone-submit"
        >
          {controller.isDeleting
            ? "Excluindo conta…"
            : "Excluir minha conta"}
        </AppButton>
        <AppButton
          tone="secondary"
          onPress={controller.handleCancel}
          disabled={controller.isDeleting}
        >
          Cancelar
        </AppButton>
        <SubmitErrorNotice controller={controller} />
      </YStack>
    </AppSurfaceCard>
  );
}

function SubmitErrorNotice({ controller }: ControllerProps): ReactElement | null {
  if (!controller.submitError) {
    return null;
  }
  if (controller.submitError.kind === "biometric") {
    return (
      <AppFormMessage
        tone="danger"
        text="Verificação biométrica obrigatória não foi concluída. Tente novamente."
      />
    );
  }
  return (
    <AppErrorNotice
      error={controller.submitError.error}
      fallbackTitle="Não foi possível excluir a conta"
      fallbackDescription="Verifique sua senha e tente novamente."
      secondaryActionLabel="Fechar"
      onSecondaryAction={controller.dismissSubmitError}
    />
  );
}
