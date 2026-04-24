import type { ReactElement } from "react";

import { Controller } from "react-hook-form";
import { Paragraph, YStack } from "tamagui";

import { PasswordStrengthMeter } from "@/features/auth/components/password-strength-meter";
import { useRegisterScreenController } from "@/features/auth/hooks/use-register-screen-controller";
import { AppButton } from "@/shared/components/app-button";
import { AppErrorNotice } from "@/shared/components/app-error-notice";
import { AppInputField } from "@/shared/components/app-input-field";
import { AppScreen } from "@/shared/components/app-screen";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";

/**
 * Canonical register screen composition for the mobile app.
 *
 * @returns View-only registration surface bound to the auth controller.
 */
export function RegisterScreen(): ReactElement {
  const controller = useRegisterScreenController();
  const {
    control,
    formState: { errors },
  } = controller.form;

  return (
    <AppScreen>
      <AppSurfaceCard
        title="Criar conta"
        description="Preencha os dados abaixo para comecar."
      >
        <YStack gap="$4">
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, onBlur, value } }) => (
              <AppInputField
                id="register-name"
                label="Nome completo"
                placeholder="Seu nome completo"
                autoCapitalize="words"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                errorText={errors.name?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <AppInputField
                id="register-email"
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

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <AppInputField
                id="register-password"
                label="Senha"
                placeholder="Crie uma senha forte"
                secureTextEntry
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                errorText={errors.password?.message}
              />
            )}
          />

          <PasswordStrengthMeter password={controller.password} />

          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <AppInputField
                id="register-confirm-password"
                label="Confirmar senha"
                placeholder="Repita sua senha"
                secureTextEntry
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                errorText={errors.confirmPassword?.message}
              />
            )}
          />

          <AppButton
            onPress={() => {
              void controller.handleSubmit();
            }}
            disabled={controller.isSubmitting}
          >
            {controller.isSubmitting ? "Criando..." : "Criar conta"}
          </AppButton>

          {controller.submitError ? (
            <AppErrorNotice
              error={controller.submitError}
              fallbackTitle="Nao foi possivel criar a conta"
              fallbackDescription="Confira seus dados e tente novamente."
              secondaryActionLabel="Fechar"
              onSecondaryAction={controller.dismissSubmitError}
            />
          ) : null}

          <AppButton tone="secondary" onPress={controller.handleBackToLogin}>
            Ja tenho conta. Entrar
          </AppButton>
        </YStack>
      </AppSurfaceCard>

      <YStack gap="$2">
        <Paragraph color="$muted" fontFamily="$body" fontSize="$2">
          Ao criar conta voce concorda com nossos termos.
        </Paragraph>
        <AppButton
          tone="secondary"
          onPress={() => {
            void controller.handleOpenTerms();
          }}
        >
          Termos de Uso
        </AppButton>
        <AppButton
          tone="secondary"
          onPress={() => {
            void controller.handleOpenPrivacy();
          }}
        >
          Politica de Privacidade
        </AppButton>
      </YStack>
    </AppScreen>
  );
}
