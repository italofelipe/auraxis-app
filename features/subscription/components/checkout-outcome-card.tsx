import type { ReactElement } from "react";

import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Paragraph, XStack, YStack, useTheme } from "tamagui";

import type { CheckoutOutcome } from "@/features/subscription/hooks/use-checkout-flow";
import { AppButton } from "@/shared/components/app-button";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";
import { useT } from "@/shared/i18n";

const SUCCESS_FEATURE_KEYS: readonly string[] = [
  "checkout.success.features.tools",
  "checkout.success.features.wallet",
  "checkout.success.features.support",
];

export interface CheckoutOutcomeCardProps {
  readonly outcome: Extract<CheckoutOutcome, "completed" | "canceled" | "dismissed">;
  readonly onPrimaryAction: () => void;
  readonly onSecondaryAction?: () => void;
}

/**
 * Rich celebrative / consoling card shown after the hosted checkout
 * returns. Replaces the previous bare async-notice block with copy
 * pulled from i18n and a clear next step (explore the app on
 * success, retry on cancel).
 */
// eslint-disable-next-line max-lines-per-function
export function CheckoutOutcomeCard({
  outcome,
  onPrimaryAction,
  onSecondaryAction,
}: CheckoutOutcomeCardProps): ReactElement {
  const { t } = useT();
  const theme = useTheme();

  if (outcome === "completed") {
    return (
      <AppSurfaceCard testID="checkout-success-card">
        <YStack gap="$3" alignItems="center">
          <YStack
            backgroundColor="$surfaceRaised"
            borderRadius={48}
            width={96}
            height={96}
            alignItems="center"
            justifyContent="center"
          >
            <MaterialCommunityIcons
              name="check-decagram"
              size={48}
              color={theme.success?.val ?? "#1f9d55"}
            />
          </YStack>
          <Paragraph
            color="$color"
            fontFamily="$heading"
            fontSize="$6"
            textAlign="center"
          >
            {t("checkout.success.title")}
          </Paragraph>
          <Paragraph
            color="$muted"
            fontFamily="$body"
            fontSize="$3"
            textAlign="center"
          >
            {t("checkout.success.description")}
          </Paragraph>
          <YStack gap="$2" width="100%">
            {SUCCESS_FEATURE_KEYS.map((key) => (
              <XStack key={key} gap="$2" alignItems="center">
                <MaterialCommunityIcons
                  name="check"
                  size={18}
                  color={theme.secondary?.val ?? "#5B5BD6"}
                />
                <Paragraph color="$color" fontFamily="$body" fontSize="$3">
                  {t(key)}
                </Paragraph>
              </XStack>
            ))}
          </YStack>
          <AppButton hapticTone="medium" onPress={onPrimaryAction}>
            {t("checkout.success.cta")}
          </AppButton>
        </YStack>
      </AppSurfaceCard>
    );
  }

  return (
    <AppSurfaceCard testID="checkout-cancel-card">
      <YStack gap="$3" alignItems="center">
        <YStack
          backgroundColor="$surfaceRaised"
          borderRadius={48}
          width={96}
          height={96}
          alignItems="center"
          justifyContent="center"
        >
          <MaterialCommunityIcons
            name="close-circle-outline"
            size={48}
            color={theme.muted?.val ?? "#8a8a8a"}
          />
        </YStack>
        <Paragraph
          color="$color"
          fontFamily="$heading"
          fontSize="$6"
          textAlign="center"
        >
          {t("checkout.cancel.title")}
        </Paragraph>
        <Paragraph
          color="$muted"
          fontFamily="$body"
          fontSize="$3"
          textAlign="center"
        >
          {t("checkout.cancel.description")}
        </Paragraph>
        <XStack gap="$2" width="100%">
          {onSecondaryAction ? (
            <AppButton flex={1} tone="secondary" onPress={onSecondaryAction}>
              {t("checkout.cancel.back")}
            </AppButton>
          ) : null}
          <AppButton flex={1} hapticTone="medium" onPress={onPrimaryAction}>
            {t("checkout.cancel.retry")}
          </AppButton>
        </XStack>
      </YStack>
    </AppSurfaceCard>
  );
}
