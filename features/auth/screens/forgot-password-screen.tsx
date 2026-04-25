import type { ReactElement } from "react";

import { Controller } from "react-hook-form";
import { Paragraph, YStack } from "tamagui";

import { useForgotPasswordScreenController } from "@/features/auth/hooks/use-forgot-password-screen-controller";
import { AppButton } from "@/shared/components/app-button";
import { AppErrorNotice } from "@/shared/components/app-error-notice";
import { AppInputField } from "@/shared/components/app-input-field";
import { AppScreen } from "@/shared/components/app-screen";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";
import { AsyncStateNotice } from "@/shared/components/async-state-notice";

/**
 * Canonical forgot-password screen composition for the mobile app.
 *
 * @returns View-only reset-request surface bound to the auth controller.
 */
export function ForgotPasswordScreen(): ReactElement {
  const controller = useForgotPasswordScreenController();
  const {
    control,
    formState: { errors },
  } = controller.form;

  if (controller.status === "success") {
    return (
      <AppScreen>
        <AppSurfaceCard
          title="E-mail enviado"
          description="Verifique sua caixa de entrada nos proximos minutos."
        >
          <YStack gap="$4">
            <AsyncStateNotice
              kind="empty"
              title="Pronto!"
              description="Se esse e-mail estiver cadastrado, voce recebera um link de recuperacao em instantes. Cheque tambem a pasta de spam."
            />
            <AppButton onPress={controller.handleBackToLogin}>
              Voltar para login
            </AppButton>
            <AppButton tone="secondary" onPress={controller.handleResubmit}>
              Enviar para outro e-mail
            </AppButton>
          </YStack>
        </AppSurfaceCard>
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <AppSurfaceCard
        title="Recuperar senha"
        description="Informe seu e-mail para receber as instrucoes."
      >
        <YStack gap="$4">
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <AppInputField
                id="forgot-password-email"
                label="E-mail"
                placeholder="seu@email.com"
                autoCapitalize="none"
                keyboardType="email-address"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                errorText={errors.email?.message}
              />
            )}
          />

          <AppButton
            onPress={() => {
              void controller.handleSubmit();
            }}
            disabled={controller.isSubmitting}
          >
            {controller.isSubmitting ? "Enviando..." : "Enviar instrucoes"}
          </AppButton>

          {controller.submitError ? (
            <AppErrorNotice
              error={controller.submitError}
              fallbackTitle="Nao foi possivel enviar o link agora"
              fallbackDescription="Confira o e-mail informado e tente novamente."
              secondaryActionLabel="Fechar"
              onSecondaryAction={controller.dismissSubmitError}
            />
          ) : null}

          <Paragraph color="$muted" fontFamily="$body" fontSize="$2">
            Por seguranca, sempre confirmaremos o envio mesmo que o e-mail
            informado nao esteja cadastrado.
          </Paragraph>

          <AppButton tone="secondary" onPress={controller.handleBackToLogin}>
            Voltar para login
          </AppButton>
        </YStack>
      </AppSurfaceCard>
    </AppScreen>
  );
}
