import type { ReactElement } from "react";

import { Paragraph, YStack } from "tamagui";

import { CheckoutOutcomeCard } from "@/features/subscription/components/checkout-outcome-card";
import { useCheckoutReturnController } from "@/features/checkout/hooks/use-checkout-return-controller";
import { AppScreen } from "@/shared/components/app-screen";
import { useT } from "@/shared/i18n";

/**
 * Dedicated landing for the Asaas hosted-checkout success redirect.
 *
 * Asaas (and equivalent gateways) typically redirects to a public HTTPS
 * URL like `https://app.auraxis.com.br/checkout/success?status=paid&...`.
 * The Universal Link / App Link configuration maps that path back to the
 * app, where this screen invalidates the subscription cache (so any
 * subsequent screen reflects the new tier) and shows the success card.
 *
 * Renders gracefully when the gateway is not yet wired (no params, or
 * `status=unknown`) — copy still nudges the user to view the subscription
 * detail screen, where the real source of truth lives.
 *
 * @returns The screen tree.
 */
export function CheckoutSuccessScreen(): ReactElement {
  const { t } = useT();
  const controller = useCheckoutReturnController("success");
  return (
    <AppScreen testID="checkout-success-screen">
      <YStack gap="$3">
        <CheckoutOutcomeCard
          outcome="completed"
          onPrimaryAction={controller.handleGoToDashboard}
          onSecondaryAction={controller.handleViewSubscription}
        />
        {controller.query.status === "pending" ? (
          <Paragraph color="$muted" fontFamily="$body" fontSize="$2" textAlign="center">
            {t("checkout.return.pendingNotice")}
          </Paragraph>
        ) : null}
      </YStack>
    </AppScreen>
  );
}
