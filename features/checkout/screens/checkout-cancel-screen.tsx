import type { ReactElement } from "react";

import { Paragraph, YStack } from "tamagui";

import { CheckoutOutcomeCard } from "@/features/subscription/components/checkout-outcome-card";
import { useCheckoutReturnController } from "@/features/checkout/hooks/use-checkout-return-controller";
import { AppScreen } from "@/shared/components/app-screen";
import { useT } from "@/shared/i18n";

/**
 * Dedicated landing for the Asaas hosted-checkout cancel/error redirect.
 *
 * Mirrors the web's `/checkout/cancel` page so the gateway can return
 * users to a friendly screen instead of the raw subscription detail.
 * The retry CTA brings the user back to the subscription/plans flow;
 * the secondary CTA returns to the dashboard.
 *
 * @returns The screen tree.
 */
export function CheckoutCancelScreen(): ReactElement {
  const { t } = useT();
  const controller = useCheckoutReturnController("cancel");
  return (
    <AppScreen testID="checkout-cancel-screen">
      <YStack gap="$3">
        <CheckoutOutcomeCard
          outcome="canceled"
          onPrimaryAction={controller.handleRetry}
          onSecondaryAction={controller.handleGoToDashboard}
        />
        {controller.query.status === "error" ? (
          <Paragraph color="$muted" fontFamily="$body" fontSize="$2" textAlign="center">
            {t("checkout.return.errorNotice")}
          </Paragraph>
        ) : null}
      </YStack>
    </AppScreen>
  );
}
