import type { ReactElement } from "react";

import { YStack } from "tamagui";

import { useSubscriptionScreenController } from "@/features/subscription/hooks/use-subscription-screen-controller";
import { AppBadge } from "@/shared/components/app-badge";
import { AppButton } from "@/shared/components/app-button";
import { AppKeyValueRow } from "@/shared/components/app-key-value-row";
import { AppQueryState } from "@/shared/components/app-query-state";
import { AppScreen } from "@/shared/components/app-screen";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";

/**
 * Canonical subscription screen composition for the mobile app.
 *
 * @returns Billing status view bound to the subscription controller.
 */
export function SubscriptionScreen(): ReactElement {
  const controller = useSubscriptionScreenController();

  return (
    <AppScreen>
      <AppSurfaceCard title="Assinatura" description="Estado atual do billing do MVP1.">
        <AppQueryState
          query={controller.subscriptionQuery}
          options={{
            loading: {
              title: "Carregando assinatura",
              description: "Conferindo plano, status e ciclo vigente.",
            },
            empty: {
              title: "Nenhuma assinatura encontrada",
              description: "Quando existir um plano ativo, ele aparecera aqui.",
            },
            error: {
              fallbackTitle: "Nao foi possivel carregar a assinatura",
              fallbackDescription: "Tente novamente em instantes.",
            },
          }}
        >
          {(subscription) => (
            <YStack gap="$3">
              <AppKeyValueRow
                label="Plano"
                value={subscription.offerCode ?? subscription.planCode}
              />
              <AppKeyValueRow
                label="Status"
                value={
                  <AppBadge tone={subscription.status === "past_due" ? "danger" : "primary"}>
                    {subscription.status}
                  </AppBadge>
                }
              />

              {subscription.currentPeriodEnd ? (
                <AppKeyValueRow
                  label="Validade"
                  value={new Date(subscription.currentPeriodEnd).toLocaleDateString("pt-BR")}
                />
              ) : null}

              {subscription.trialEndsAt ? (
                <AppKeyValueRow
                  label="Trial ate"
                  value={new Date(subscription.trialEndsAt).toLocaleDateString("pt-BR")}
                />
              ) : null}

              <AppButton
                onPress={() => {
                  void controller.handleManageSubscription();
                }}
                testID="manage-subscription-button"
              >
                Gerenciar assinatura
              </AppButton>
            </YStack>
          )}
        </AppQueryState>
      </AppSurfaceCard>
    </AppScreen>
  );
}
