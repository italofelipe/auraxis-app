import type { ReactElement } from "react";

import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Paragraph, XStack, YStack, useTheme } from "tamagui";

import { useConfirmEmailScreenController } from "@/features/auth/hooks/use-confirm-email-screen-controller";
import { AppAsyncState } from "@/shared/components/app-async-state";
import { AppButton } from "@/shared/components/app-button";
import { AppScreen } from "@/shared/components/app-screen";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";
import { useT } from "@/shared/i18n";

interface OutcomeCardProps {
  readonly icon: keyof typeof MaterialCommunityIcons.glyphMap;
  readonly iconTone: "success" | "muted" | "danger";
  readonly title: string;
  readonly description: string;
  readonly children: ReactElement;
  readonly testID: string;
}

function OutcomeCard(props: OutcomeCardProps): ReactElement {
  const { icon, iconTone, title, description, children, testID } = props;
  const theme = useTheme();
  const colorByTone: Record<typeof iconTone, string> = {
    success: theme.success?.val ?? "#1f9d55",
    muted: theme.muted?.val ?? "#8a8a8a",
    danger: theme.danger?.val ?? "#cc3344",
  };
  return (
    <AppSurfaceCard testID={testID}>
      <YStack gap="$3" alignItems="center">
        <YStack
          backgroundColor="$surfaceRaised"
          borderRadius={48}
          width={96}
          height={96}
          alignItems="center"
          justifyContent="center"
        >
          <MaterialCommunityIcons name={icon} size={48} color={colorByTone[iconTone]} />
        </YStack>
        <Paragraph color="$color" fontFamily="$heading" fontSize="$6" textAlign="center">
          {title}
        </Paragraph>
        <Paragraph color="$muted" fontFamily="$body" fontSize="$3" textAlign="center">
          {description}
        </Paragraph>
        {children}
      </YStack>
    </AppSurfaceCard>
  );
}

/**
 * Landing for the email confirmation link.
 *
 * Auto-fires the confirmation mutation when a `token` query param is
 * present and renders one of four states: pending while the request is
 * in flight, success when the token was accepted, error when the API
 * rejected it (expired/used token), and a default "no token" view for
 * users that hit the route directly.
 *
 * @returns The screen tree.
 */
export function ConfirmEmailScreen(): ReactElement {
  const { t } = useT();
  const controller = useConfirmEmailScreenController();

  if (controller.status === "pending") {
    return (
      <AppScreen testID="confirm-email-screen">
        <AppAsyncState
          state={{
            kind: "loading",
            title: t("auth.confirmEmail.confirming"),
            description: t("auth.confirmEmail.wait"),
            presentation: "notice",
            skeletonLines: 3,
          }}
        />
      </AppScreen>
    );
  }

  if (controller.status === "success") {
    return (
      <AppScreen testID="confirm-email-screen">
        <OutcomeCard
          icon="check-decagram"
          iconTone="success"
          title={t("auth.confirmEmail.successTitle")}
          description={t("auth.confirmEmail.successDescription")}
          testID="confirm-email-success-card"
        >
          <AppButton hapticTone="medium" onPress={controller.handleGoToDashboard}>
            {t("auth.confirmEmail.cta")}
          </AppButton>
        </OutcomeCard>
      </AppScreen>
    );
  }

  if (controller.status === "error") {
    return (
      <AppScreen testID="confirm-email-screen">
        <OutcomeCard
          icon="close-circle-outline"
          iconTone="danger"
          title={t("auth.confirmEmail.errorTitle")}
          description={t("auth.confirmEmail.errorDescription")}
          testID="confirm-email-error-card"
        >
          <XStack gap="$2" width="100%">
            <AppButton flex={1} tone="secondary" onPress={controller.handleGoToLogin}>
              {t("auth.confirmEmail.backToLogin")}
            </AppButton>
            <AppButton flex={1} hapticTone="medium" onPress={controller.handleResendConfirmation}>
              {t("auth.confirmEmail.resendCta")}
            </AppButton>
          </XStack>
        </OutcomeCard>
      </AppScreen>
    );
  }

  return (
    <AppScreen testID="confirm-email-screen">
      <OutcomeCard
        icon="email-outline"
        iconTone="muted"
        title={t("auth.confirmEmail.noTokenTitle")}
        description={t("auth.confirmEmail.noTokenDescription")}
        testID="confirm-email-no-token-card"
      >
        <XStack gap="$2" width="100%">
          <AppButton flex={1} tone="secondary" onPress={controller.handleGoToLogin}>
            {t("auth.confirmEmail.backToLogin")}
          </AppButton>
          <AppButton flex={1} hapticTone="medium" onPress={controller.handleResendConfirmation}>
            {t("auth.confirmEmail.resendCta")}
          </AppButton>
        </XStack>
      </OutcomeCard>
    </AppScreen>
  );
}
