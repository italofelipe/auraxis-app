import type { ReactElement } from "react";

import { Controller } from "react-hook-form";
import { Paragraph, YStack } from "tamagui";

import { useLoginScreenController } from "@/features/auth/hooks/use-login-screen-controller";
import { AppButton } from "@/shared/components/app-button";
import { AppErrorNotice } from "@/shared/components/app-error-notice";
import { AppInputField } from "@/shared/components/app-input-field";
import { AppScreen } from "@/shared/components/app-screen";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";
import { AsyncStateNotice } from "@/shared/components/async-state-notice";

/**
 * Canonical login screen composition for the mobile app.
 *
 * @returns View-only login surface bound to the auth controller.
 */
export function LoginScreen(): ReactElement {
  const controller = useLoginScreenController();
  const {
    control,
    formState: { errors },
  } = controller.form;

  return (
    <AppScreen>
      <AppSurfaceCard title="Entrar" description="Acesso a area logada.">
        <YStack gap="$4">
          {controller.sessionFailureNotice ? (
            <YStack gap="$3">
              <AsyncStateNotice
                kind="error"
                title={controller.sessionFailureNotice.title}
                description={controller.sessionFailureNotice.description}
              />
              {controller.sessionFailureNotice.dismissLabel ? (
                <AppButton
                  tone="secondary"
                  onPress={controller.dismissSessionFailureNotice}>
                  {controller.sessionFailureNotice.dismissLabel}
                </AppButton>
              ) : null}
            </YStack>
          ) : null}

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <AppInputField
                id="login-email"
                label="E-mail"
                placeholder="E-mail"
                autoCapitalize="none"
                keyboardType="email-address"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                errorText={errors.email?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <AppInputField
                id="login-password"
                label="Senha"
                placeholder="Senha"
                secureTextEntry
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                errorText={errors.password?.message}
              />
            )}
          />

          <AppButton
            onPress={() => {
              void controller.handleSubmit();
            }}
            disabled={controller.isSubmitting}>
            {controller.isSubmitting ? "Entrando..." : "Entrar"}
          </AppButton>

          {controller.submitError ? (
            <AppErrorNotice
              error={controller.submitError}
              fallbackTitle="Nao foi possivel entrar agora"
              fallbackDescription="Confira seus dados e tente novamente."
              secondaryActionLabel="Fechar"
              onSecondaryAction={controller.dismissSubmitError}
            />
          ) : null}

          <AppButton tone="secondary" onPress={controller.handleForgotPassword}>
            Esqueceu sua senha?
          </AppButton>
        </YStack>
      </AppSurfaceCard>

      <Paragraph color="$muted" fontFamily="$body" fontSize="$2">
        Placeholder estrutural da rota de login, agora restrito a `features/auth`,
        `shared/*` e `core/*`.
      </Paragraph>

      <YStack gap="$2">
        <AppButton
          tone="secondary"
          onPress={() => {
            void controller.handleOpenTerms();
          }}>
          Termos de Uso
        </AppButton>
        <AppButton
          tone="secondary"
          onPress={() => {
            void controller.handleOpenPrivacy();
          }}>
          Politica de Privacidade
        </AppButton>
      </YStack>
    </AppScreen>
  );
}
