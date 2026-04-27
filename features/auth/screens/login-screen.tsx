import type { ReactElement } from "react";

import { Controller, type Control, type FieldErrors } from "react-hook-form";
import { Paragraph, YStack } from "tamagui";

import { TurnstileChallenge } from "@/features/auth/components/turnstile-challenge";
import {
  useLoginScreenController,
  type LoginScreenController,
} from "@/features/auth/hooks/use-login-screen-controller";
import type { LoginFormValues } from "@/features/auth/validators";
import { AppButton } from "@/shared/components/app-button";
import { AppErrorNotice } from "@/shared/components/app-error-notice";
import { AppInputField } from "@/shared/components/app-input-field";
import { AppScreen } from "@/shared/components/app-screen";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";
import { AsyncStateNotice } from "@/shared/components/async-state-notice";
import { useT } from "@/shared/i18n";

interface SessionFailureNotice {
  readonly title: string;
  readonly description: string;
  readonly dismissLabel: string | null;
}

/**
 * Canonical login screen composition for the mobile app.
 *
 * @returns View-only login surface bound to the auth controller.
 */
export function LoginScreen(): ReactElement {
  const controller = useLoginScreenController();

  return (
    <AppScreen>
      <AppSurfaceCard
        title="Bem-vindo de volta"
        description="Faca login na sua conta para continuar."
      >
        <YStack gap="$4">
          {controller.sessionFailureNotice ? (
            <SessionFailureNoticeBlock
              notice={controller.sessionFailureNotice}
              onDismiss={controller.dismissSessionFailureNotice}
            />
          ) : null}

          <LoginFields
            control={controller.form.control}
            errors={controller.form.formState.errors}
          />

          <CaptchaBlock controller={controller} />

          <AppButton
            onPress={() => {
              void controller.handleSubmit();
            }}
            disabled={controller.isSubmitting}
          >
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

      <RegisterCallToAction onPress={controller.handleRegister} />

      <LegalLinks
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

interface LoginFieldsProps {
  readonly control: Control<LoginFormValues>;
  readonly errors: FieldErrors<LoginFormValues>;
}

function LoginFields({ control, errors }: LoginFieldsProps): ReactElement {
  return (
    <YStack gap="$4">
      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, onBlur, value } }) => (
          <AppInputField
            id="login-email"
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
            id="login-password"
            label="Senha"
            placeholder="Sua senha"
            autoComplete="password"
            textContentType="password"
            secureTextEntry
            value={value}
            onBlur={onBlur}
            onChangeText={onChange}
            errorText={errors.password?.message}
          />
        )}
      />
    </YStack>
  );
}

interface SessionFailureNoticeBlockProps {
  readonly notice: SessionFailureNotice;
  readonly onDismiss: () => void;
}

interface CaptchaBlockProps {
  readonly controller: LoginScreenController;
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
        testID="login-captcha"
      />
      {controller.captcha.missingChallenge ? (
        <Paragraph color="$danger" fontFamily="$body" fontSize="$2">
          {t("auth.captcha.missing")}
        </Paragraph>
      ) : null}
    </YStack>
  );
}

function SessionFailureNoticeBlock({
  notice,
  onDismiss,
}: SessionFailureNoticeBlockProps): ReactElement {
  return (
    <YStack gap="$3">
      <AsyncStateNotice
        kind="error"
        title={notice.title}
        description={notice.description}
      />
      {notice.dismissLabel ? (
        <AppButton tone="secondary" onPress={onDismiss}>
          {notice.dismissLabel}
        </AppButton>
      ) : null}
    </YStack>
  );
}

function RegisterCallToAction({ onPress }: { readonly onPress: () => void }): ReactElement {
  return (
    <YStack gap="$2" alignItems="center">
      <Paragraph color="$muted" fontFamily="$body" fontSize="$3">
        Ainda nao tem conta?
      </Paragraph>
      <AppButton tone="secondary" onPress={onPress}>
        Criar conta
      </AppButton>
    </YStack>
  );
}

interface LegalLinksProps {
  readonly onOpenTerms: () => void;
  readonly onOpenPrivacy: () => void;
}

function LegalLinks({ onOpenTerms, onOpenPrivacy }: LegalLinksProps): ReactElement {
  return (
    <YStack gap="$2">
      <AppButton tone="secondary" onPress={onOpenTerms}>
        Termos de Uso
      </AppButton>
      <AppButton tone="secondary" onPress={onOpenPrivacy}>
        Politica de Privacidade
      </AppButton>
    </YStack>
  );
}
