import { Paragraph, XStack, YStack } from "tamagui";

import { useSubscriptionScreenController } from "@/features/subscription/hooks/use-subscription-screen-controller";
import { AppBadge } from "@/shared/components/app-badge";
import { AppButton } from "@/shared/components/app-button";
import { AppScreen } from "@/shared/components/app-screen";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";
import { AsyncStateNotice } from "@/shared/components/async-state-notice";

export default function AssinaturaScreen() {
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
          <AsyncStateNotice
            kind="error"
            title="Nao foi possivel carregar a assinatura"
            description="Tente novamente em instantes."
          />
        ) : subscription ? (
          <YStack gap="$3">
            <XStack alignItems="center" gap="$2">
              <Paragraph color="$muted" fontFamily="$body" fontSize="$3">
                Plano:
              </Paragraph>
              <Paragraph color="$color" fontFamily="$body" fontSize="$4">
                {subscription.offerCode ?? subscription.planCode}
              </Paragraph>
            </XStack>

            <XStack alignItems="center" gap="$2">
              <Paragraph color="$muted" fontFamily="$body" fontSize="$3">
                Status:
              </Paragraph>
              <AppBadge tone={subscription.status === "past_due" ? "danger" : "primary"}>
                {subscription.status}
              </AppBadge>
            </XStack>

            {subscription.currentPeriodEnd ? (
              <XStack alignItems="center" gap="$2">
                <Paragraph color="$muted" fontFamily="$body" fontSize="$3">
                  Validade:
                </Paragraph>
                <Paragraph color="$color" fontFamily="$body" fontSize="$4">
                  {new Date(subscription.currentPeriodEnd).toLocaleDateString("pt-BR")}
                </Paragraph>
              </XStack>
            ) : null}

            {subscription.trialEndsAt ? (
              <XStack alignItems="center" gap="$2">
                <Paragraph color="$muted" fontFamily="$body" fontSize="$3">
                  Trial ate:
                </Paragraph>
                <Paragraph color="$color" fontFamily="$body" fontSize="$4">
                  {new Date(subscription.trialEndsAt).toLocaleDateString("pt-BR")}
                </Paragraph>
              </XStack>
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
