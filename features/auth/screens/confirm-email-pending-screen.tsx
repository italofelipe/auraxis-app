import type { ReactElement } from "react";

import { Paragraph, YStack } from "tamagui";

import { useConfirmEmailPendingController } from "@/features/auth/hooks/use-confirm-email-pending-controller";
import { AppButton } from "@/shared/components/app-button";
import { AppErrorNotice } from "@/shared/components/app-error-notice";
import { AppScreen } from "@/shared/components/app-screen";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";
import { AsyncStateNotice } from "@/shared/components/async-state-notice";

const BENEFITS = [
  "Acesso completo a sua conta",
  "Recuperacao de senha facilitada",
  "Notificacoes financeiras importantes",
] as const;

/**
 * Post-register prompt asking the user to confirm their email.
 *
 * @returns View-only screen bound to the confirm-email-pending controller.
 */
export function ConfirmEmailPendingScreen(): ReactElement {
  const controller = useConfirmEmailPendingController();

  return (
    <AppScreen>
      <AppSurfaceCard
        title="Confirme seu e-mail"
        description="Confirme seu e-mail para garantir acesso completo a sua conta."
      >
        <YStack gap="$4">
          {controller.maskedEmail ? (
            <Paragraph color="$color" fontFamily="$body" fontSize="$4">
              Enviamos um link para {controller.maskedEmail}.
            </Paragraph>
          ) : (
            <Paragraph color="$muted" fontFamily="$body" fontSize="$3">
              Verifique sua caixa de entrada e tambem a pasta de spam.
            </Paragraph>
          )}

          <YStack
            gap="$2"
            padding="$3"
            backgroundColor="$surfaceRaised"
            borderRadius="$2"
          >
            <Paragraph color="$color" fontFamily="$heading" fontSize="$5">
              Voce tem 7 dias para confirmar
            </Paragraph>
            <Paragraph color="$muted" fontFamily="$body" fontSize="$3">
              A confirmacao mantem sua conta ativa e desbloqueia recuperacao de senha.
            </Paragraph>
          </YStack>

          <YStack gap="$1">
            {BENEFITS.map((label) => (
              <Paragraph
                key={label}
                color="$color"
                fontFamily="$body"
                fontSize="$3"
              >
                · {label}
              </Paragraph>
            ))}
          </YStack>

          {controller.resendSucceeded ? (
            <AsyncStateNotice
              kind="empty"
              title="Confirmacao reenviada"
              description="Cheque sua caixa de entrada nos proximos minutos."
            />
          ) : null}

          {controller.resendError ? (
            <AppErrorNotice
              error={controller.resendError}
              fallbackTitle="Nao foi possivel reenviar agora"
              fallbackDescription="Tente novamente em alguns instantes."
              secondaryActionLabel="Fechar"
              onSecondaryAction={controller.dismissResendError}
            />
          ) : null}

          <AppButton
            onPress={() => {
              void controller.handleResend();
            }}
            disabled={controller.isResending}
          >
            {controller.isResending ? "Reenviando..." : "Reenviar confirmacao"}
          </AppButton>

          <AppButton tone="secondary" onPress={controller.handleSkip}>
            Pular por enquanto
          </AppButton>
        </YStack>
      </AppSurfaceCard>
    </AppScreen>
  );
}
