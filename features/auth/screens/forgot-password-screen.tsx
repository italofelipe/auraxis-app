import type { ReactElement } from "react";

import { Controller } from "react-hook-form";
import { YStack } from "tamagui";

import { useForgotPasswordScreenController } from "@/features/auth/hooks/use-forgot-password-screen-controller";
import { AppButton } from "@/shared/components/app-button";
import { AppInputField } from "@/shared/components/app-input-field";
import { AppScreen } from "@/shared/components/app-screen";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";

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

  return (
    <AppScreen>
      <AppSurfaceCard
        title="Recuperar senha"
        description="Envie o link de recuperacao usando o fluxo canonico de auth.">
        <YStack gap="$4">
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <AppInputField
                id="forgot-password-email"
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

          <AppButton
            onPress={() => {
              void controller.handleSubmit();
            }}
            disabled={controller.isSubmitting}>
            {controller.isSubmitting ? "Enviando..." : "Enviar"}
          </AppButton>

          <AppButton tone="secondary" onPress={controller.handleBackToLogin}>
            Voltar para login
          </AppButton>
        </YStack>
      </AppSurfaceCard>
    </AppScreen>
  );
}
