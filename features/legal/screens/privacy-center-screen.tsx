import type { ReactElement } from "react";

import { Paragraph, YStack } from "tamagui";

import {
  usePrivacyCenterScreenController,
  type PrivacyCenterScreenController,
} from "@/features/legal/hooks/use-privacy-center-screen-controller";
import { PRIVACY_SUPPORT_EMAIL } from "@/features/legal/privacy-center-config";
import { AppButton } from "@/shared/components/app-button";
import { AppErrorNotice } from "@/shared/components/app-error-notice";
import { AppFormMessage } from "@/shared/components/app-form-message";
import { AppScreen } from "@/shared/components/app-screen";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";

export function PrivacyCenterScreen(): ReactElement {
  const controller = usePrivacyCenterScreenController();

  return (
    <AppScreen testID="privacy-center-screen">
      <OverviewCard />
      <DocumentsCard controller={controller} />
      <DataRightsCard controller={controller} />
      <DeleteAccountCard controller={controller} />
    </AppScreen>
  );
}

function OverviewCard(): ReactElement {
  return (
    <AppSurfaceCard
      title="Central de privacidade"
      description="Controle seus documentos, direitos LGPD e solicitacoes de dados."
    >
      <YStack gap="$2">
        <Paragraph color="$color" fontFamily="$body" fontSize="$4">
          Consulte os documentos vigentes, solicite exportacao dos seus dados
          e acesse a exclusao segura de conta quando precisar.
        </Paragraph>
        <Paragraph color="$muted" fontFamily="$body" fontSize="$3">
          O canal oficial de privacidade e {PRIVACY_SUPPORT_EMAIL}.
        </Paragraph>
      </YStack>
    </AppSurfaceCard>
  );
}

interface ControllerProps {
  readonly controller: PrivacyCenterScreenController;
}

function DocumentsCard({ controller }: ControllerProps): ReactElement {
  return (
    <AppSurfaceCard
      title="Documentos e cookies"
      description="Os links publicos seguem a mesma base documental da Web."
    >
      <YStack gap="$2">
        <AppButton
          tone="secondary"
          onPress={controller.handleOpenPrivacyPolicy}
          testID="privacy-center-open-policy"
        >
          Politica de Privacidade
        </AppButton>
        <AppButton
          tone="secondary"
          onPress={controller.handleOpenTermsOfService}
          testID="privacy-center-open-terms"
        >
          Termos de Uso
        </AppButton>
        <AppButton
          tone="secondary"
          onPress={controller.handleOpenCookiesInfo}
          testID="privacy-center-open-cookies"
        >
          Cookies e analytics
        </AppButton>
      </YStack>
    </AppSurfaceCard>
  );
}

function DataRightsCard({ controller }: ControllerProps): ReactElement {
  const isLoading = controller.exportRequestState === "loading";
  return (
    <AppSurfaceCard
      title="Direitos do titular"
      description="Acesso, portabilidade, correcao, exclusao e revogacao quando aplicavel."
    >
      <YStack gap="$3">
        <Paragraph color="$color" fontFamily="$body" fontSize="$4">
          A exportacao completa depende do contrato LGPD da API. Enquanto ele
          nao estiver disponivel no app, a solicitacao abre o canal oficial para
          atendimento e verificacao de identidade.
        </Paragraph>
        <AppButton
          onPress={() => {
            void controller.handleRequestDataExport();
          }}
          disabled={isLoading}
          testID="privacy-center-request-export"
        >
          {isLoading ? "Abrindo canal seguro..." : "Solicitar exportacao de dados"}
        </AppButton>
        <ExportRequestFeedback controller={controller} />
      </YStack>
    </AppSurfaceCard>
  );
}

function ExportRequestFeedback({ controller }: ControllerProps): ReactElement | null {
  if (controller.exportRequestState === "success") {
    return (
      <AppFormMessage
        text="Seu app de email foi aberto. Revise a mensagem antes de enviar a solicitacao."
      />
    );
  }

  if (controller.exportRequestState === "error" && controller.exportRequestError) {
    return (
      <AppErrorNotice
        error={controller.exportRequestError}
        fallbackTitle="Nao foi possivel abrir a solicitacao"
        fallbackDescription="Abra seu email manualmente e escreva para suporte@auraxis.com.br."
        secondaryActionLabel="Fechar"
        onSecondaryAction={controller.dismissExportRequestFeedback}
      />
    );
  }

  return null;
}

function DeleteAccountCard({ controller }: ControllerProps): ReactElement {
  return (
    <AppSurfaceCard
      title="Exclusao de conta"
      description="Fluxo irreversivel com confirmacao segura."
    >
      <YStack gap="$3">
        <Paragraph color="$muted" fontFamily="$body" fontSize="$3">
          Para excluir a conta, o app exige aceite explicito, frase de
          confirmacao, senha atual e verificacao biometrica quando disponivel.
        </Paragraph>
        <AppButton
          tone="danger"
          onPress={controller.handleOpenDeleteAccount}
          testID="privacy-center-delete-account"
        >
          Excluir minha conta
        </AppButton>
      </YStack>
    </AppSurfaceCard>
  );
}
