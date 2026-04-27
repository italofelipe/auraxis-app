import type { ReactElement } from "react";

import { Controller, type Control, type FieldErrors } from "react-hook-form";
import { Paragraph, YStack } from "tamagui";

import { PasswordStrengthMeter } from "@/features/auth/components/password-strength-meter";
import { TurnstileChallenge } from "@/features/auth/components/turnstile-challenge";
import {
  useRegisterScreenController,
  type RegisterScreenController,
} from "@/features/auth/hooks/use-register-screen-controller";
import type { RegisterFormValues } from "@/features/auth/validators";
import { AppButton } from "@/shared/components/app-button";
import { AppErrorNotice } from "@/shared/components/app-error-notice";
import { AppInputField } from "@/shared/components/app-input-field";
import { AppScreen } from "@/shared/components/app-screen";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";
import { useT } from "@/shared/i18n";

const resolvePassword = (value: string | undefined): string => value ?? "";

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
  const password = resolvePassword(controller.form.watch("password"));

  return (
    <AppScreen>
      <AppSurfaceCard
        title="Criar conta"
        description="Preencha os dados abaixo para comecar."
      >
        <YStack gap="$4">
          <RegisterFields control={control} errors={errors} password={password} />

          <CaptchaBlock controller={controller} />

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

      <RegisterLegalFooter
        onOpenTerms={() => {
          void controller.handleOpenTerms();
        }}
        onOpenPrivacy={() => {
          void controller.handleOpenPrivacy();
        }}
      />
    </AppScreen>
  );
}

interface CaptchaBlockProps {
  readonly controller: RegisterScreenController;
}

function CaptchaBlock({ controller }: CaptchaBlockProps): ReactElement | null {
  const { t } = useT();
  if (!controller.captcha.required) {
    return null;
  }
  return (
    <YStack gap="$2">
      <TurnstileChallenge
        onToken={controller.handleCaptchaToken}
        onExpired={controller.handleCaptchaExpired}
        testID="register-captcha"
      />
      {controller.captcha.missingChallenge ? (
        <Paragraph color="$danger" fontFamily="$body" fontSize="$2">
          {t("auth.captcha.missing")}
        </Paragraph>
      ) : null}
    </YStack>
  );
}

interface RegisterFieldsProps {
  readonly control: Control<RegisterFormValues>;
  readonly errors: FieldErrors<RegisterFormValues>;
  readonly password: string;
}

function RegisterFields({ control, errors, password }: RegisterFieldsProps): ReactElement {
  return (
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
            autoComplete="name"
            textContentType="name"
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
            autoComplete="email"
            keyboardType="email-address"
            textContentType="emailAddress"
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
            autoComplete="password-new"
            textContentType="newPassword"
            secureTextEntry
            value={value}
            onBlur={onBlur}
            onChangeText={onChange}
            errorText={errors.password?.message}
          />
        )}
      />
      <PasswordStrengthMeter password={password} />
      <Controller
        control={control}
        name="confirmPassword"
        render={({ field: { onChange, onBlur, value } }) => (
          <AppInputField
            id="register-confirm-password"
            label="Confirmar senha"
            placeholder="Repita sua senha"
            autoComplete="password-new"
            textContentType="newPassword"
            secureTextEntry
            value={value}
            onBlur={onBlur}
            onChangeText={onChange}
            errorText={errors.confirmPassword?.message}
          />
        )}
      />
    </YStack>
  );
}

interface RegisterLegalFooterProps {
  readonly onOpenTerms: () => void;
  readonly onOpenPrivacy: () => void;
}

function RegisterLegalFooter({
  onOpenTerms,
  onOpenPrivacy,
}: RegisterLegalFooterProps): ReactElement {
  return (
    <YStack gap="$2">
      <Paragraph color="$muted" fontFamily="$body" fontSize="$2">
        Ao criar conta voce concorda com nossos termos.
      </Paragraph>
      <AppButton tone="secondary" onPress={onOpenTerms}>
        Termos de Uso
      </AppButton>
      <AppButton tone="secondary" onPress={onOpenPrivacy}>
        Politica de Privacidade
      </AppButton>
    </YStack>
  );
}
