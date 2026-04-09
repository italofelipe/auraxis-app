import type { ReactElement } from "react";

import { YStack } from "tamagui";

import { useSubscriptionScreenController } from "@/features/subscription/hooks/use-subscription-screen-controller";
import { AppBadge } from "@/shared/components/app-badge";
import { AppButton } from "@/shared/components/app-button";
import { AppErrorNotice } from "@/shared/components/app-error-notice";
import { AppKeyValueRow } from "@/shared/components/app-key-value-row";
import { AppScreen } from "@/shared/components/app-screen";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";
import { AsyncStateNotice } from "@/shared/components/async-state-notice";

/**
 * Canonical subscription screen composition for the mobile app.
 *
 * @returns Billing status view bound to the subscription controller.
 */
export function SubscriptionScreen(): ReactElement {
  const controller = useSubscriptionScreenController();
  const subscription = controller.subscriptionQuery.data;

  return (
    <AppScreen>
      <AppSurfaceCard title="Assinatura" description="Estado atual do billing do MVP1.">
        {controller.subscriptionQuery.isPending ? (
          <AsyncStateNotice
            kind="loading"
            title="Carregando assinatura"
            description="Conferindo plano, status e ciclo vigente."
          />
        ) : controller.subscriptionQuery.isError ? (
          <AppErrorNotice
            error={controller.subscriptionQuery.error}
            fallbackTitle="Nao foi possivel carregar a assinatura"
            fallbackDescription="Tente novamente em instantes."
            onAction={() => {
              void controller.subscriptionQuery.refetch();
            }}
          />
        ) : subscription ? (
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
              testID="manage-subscription-button">
              Gerenciar assinatura
            </AppButton>
          </YStack>
        ) : (
          <AsyncStateNotice
            kind="empty"
            title="Nenhuma assinatura encontrada"
            description="Quando existir um plano ativo, ele aparecera aqui."
          />
        )}
      </AppSurfaceCard>
    </AppScreen>
  );
}
