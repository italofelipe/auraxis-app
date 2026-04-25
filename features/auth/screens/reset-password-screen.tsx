import type { ReactElement } from "react";

import { Controller, type Control, type FieldErrors } from "react-hook-form";
import { Paragraph, YStack } from "tamagui";

import { useResetPasswordScreenController } from "@/features/auth/hooks/use-reset-password-screen-controller";
import type { ResetPasswordFormValues } from "@/features/auth/validators";
import { AppButton } from "@/shared/components/app-button";
import { AppErrorNotice } from "@/shared/components/app-error-notice";
import { AppInputField } from "@/shared/components/app-input-field";
import { AppScreen } from "@/shared/components/app-screen";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";
import { AsyncStateNotice } from "@/shared/components/async-state-notice";

/**
 * Canonical password reset screen for the mobile app.
 *
 * @returns Form to redefine the password using a token from the deep link.
 */
export function ResetPasswordScreen(): ReactElement {
  const controller = useResetPasswordScreenController();

  if (controller.status === "success") {
    return (
      <ResetPasswordSuccess onBackToLogin={controller.handleBackToLogin} />
    );
  }

  return (
    <AppScreen>
      <AppSurfaceCard
        title="Redefinir senha"
        description="Digite a nova senha. O link tem validade limitada."
      >
        <YStack gap="$4">
          <ResetPasswordFields
            control={controller.form.control}
            errors={controller.form.formState.errors}
            tokenFromLink={controller.hasTokenFromLink}
          />
          <AppButton
            onPress={() => {
              void controller.handleSubmit();
            }}
            disabled={controller.isSubmitting}
          >
            {controller.isSubmitting ? "Redefinindo..." : "Redefinir senha"}
          </AppButton>
          {controller.submitError ? (
            <AppErrorNotice
              error={controller.submitError}
              fallbackTitle="Nao foi possivel redefinir a senha"
              fallbackDescription="O link pode ter expirado. Solicite um novo na tela de recuperacao."
              secondaryActionLabel="Fechar"
              onSecondaryAction={controller.dismissSubmitError}
            />
          ) : null}
          <AppButton tone="secondary" onPress={controller.handleBackToLogin}>
            Voltar para login
          </AppButton>
        </YStack>
      </AppSurfaceCard>
    </AppScreen>
  );
}

interface ResetPasswordFieldsProps {
  readonly control: Control<ResetPasswordFormValues>;
  readonly errors: FieldErrors<ResetPasswordFormValues>;
  readonly tokenFromLink: boolean;
}

function ResetPasswordFields({
  control,
  errors,
  tokenFromLink,
}: ResetPasswordFieldsProps): ReactElement {
  return (
    <YStack gap="$4">
      {!tokenFromLink ? (
        <Controller
          control={control}
          name="token"
          render={({ field: { onChange, onBlur, value } }) => (
            <AppInputField
              id="reset-token"
              label="Token de recuperacao"
              placeholder="Cole o token recebido por e-mail"
              autoCapitalize="none"
              value={value ?? ""}
              onBlur={onBlur}
              onChangeText={onChange}
              errorText={errors.token?.message}
            />
          )}
        />
      ) : (
        <Paragraph color="$muted" fontFamily="$body" fontSize="$2">
          Token recebido pelo link aplicado automaticamente.
        </Paragraph>
      )}
      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, onBlur, value } }) => (
          <AppInputField
            id="reset-password"
            label="Nova senha"
            placeholder="Crie uma senha forte"
            autoComplete="password-new"
            textContentType="newPassword"
            secureTextEntry
            value={value ?? ""}
            onBlur={onBlur}
            onChangeText={onChange}
            errorText={errors.password?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="confirmPassword"
        render={({ field: { onChange, onBlur, value } }) => (
          <AppInputField
            id="reset-confirm-password"
            label="Confirmar nova senha"
            placeholder="Repita a nova senha"
            autoComplete="password-new"
            textContentType="newPassword"
            secureTextEntry
            value={value ?? ""}
            onBlur={onBlur}
            onChangeText={onChange}
            errorText={errors.confirmPassword?.message}
          />
        )}
      />
    </YStack>
  );
}

function ResetPasswordSuccess({
  onBackToLogin,
}: {
  readonly onBackToLogin: () => void;
}): ReactElement {
  return (
    <AppScreen>
      <AppSurfaceCard
        title="Senha redefinida"
        description="Use a nova senha para entrar na sua conta."
      >
        <YStack gap="$4">
          <AsyncStateNotice
            kind="empty"
            title="Tudo certo!"
            description="Sua senha foi atualizada com sucesso."
          />
          <AppButton onPress={onBackToLogin}>Ir para login</AppButton>
        </YStack>
      </AppSurfaceCard>
    </AppScreen>
  );
}
