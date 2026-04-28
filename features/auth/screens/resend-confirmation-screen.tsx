import type { ReactElement } from "react";

import { Paragraph, YStack } from "tamagui";

import { useResendConfirmationScreenController } from "@/features/auth/hooks/use-resend-confirmation-screen-controller";
import { AppButton } from "@/shared/components/app-button";
import { AppErrorNotice } from "@/shared/components/app-error-notice";
import { AppInputField } from "@/shared/components/app-input-field";
import { AppScreen } from "@/shared/components/app-screen";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";
import { useT } from "@/shared/i18n";

/**
 * Standalone /resend-confirmation screen reachable via deep link or
 * via the "I didn't receive" link inside `confirm-email-pending`.
 * Wraps the existing resend mutation in a form with a local 60s
 * rate limit so impatient users don't bounce off the backend limit.
 */
export function ResendConfirmationScreen(): ReactElement {
  const { t } = useT();
  const controller = useResendConfirmationScreenController();

  const submitLabel = controller.isSubmitting
    ? t("auth.resendConfirmation.submitting")
    : controller.remainingSeconds > 0
      ? t("auth.resendConfirmation.rateLimited", {
          seconds: controller.remainingSeconds,
        })
      : t("auth.resendConfirmation.submit");

  return (
    <AppScreen>
      <AppSurfaceCard
        title={t("auth.resendConfirmation.title")}
        description={t("auth.resendConfirmation.description")}
      >
        <YStack gap="$4">
          <AppInputField
            id="resend-email"
            label={t("auth.resendConfirmation.emailLabel")}
            value={controller.email}
            disabled={!controller.canEditEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            onChangeText={controller.setEmail}
          />

          <AppButton
            onPress={() => {
              void controller.handleSubmit();
            }}
            disabled={
              controller.isSubmitting || controller.remainingSeconds > 0
            }
          >
            {submitLabel}
          </AppButton>

          {controller.hasSucceeded ? (
            <Paragraph color="$success" fontFamily="$body" fontSize="$3">
              {t("auth.resendConfirmation.success")}
            </Paragraph>
          ) : null}

          {controller.submitError ? (
            <AppErrorNotice
              error={controller.submitError}
              fallbackTitle={t("auth.resendConfirmation.title")}
              secondaryActionLabel="Fechar"
              onSecondaryAction={controller.dismissSubmitError}
            />
          ) : null}

          <AppButton tone="secondary" onPress={controller.handleBackToLogin}>
            {t("auth.resendConfirmation.backToLogin")}
          </AppButton>
        </YStack>
      </AppSurfaceCard>
    </AppScreen>
  );
}
