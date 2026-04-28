import type { ReactElement } from "react";

import { useRouter } from "expo-router";
import { Paragraph, YStack } from "tamagui";

import { appRoutes } from "@/core/navigation/routes";
import { BillingPlanCard } from "@/features/subscription/components/billing-plan-card";
import { CheckoutOutcomeCard } from "@/features/subscription/components/checkout-outcome-card";
import {
  useSubscriptionScreenController,
  type SubscriptionScreenController,
} from "@/features/subscription/hooks/use-subscription-screen-controller";
import type { SubscriptionState } from "@/features/subscription/contracts";
import { AppBadge } from "@/shared/components/app-badge";
import { AppButton } from "@/shared/components/app-button";
import { AppErrorNotice } from "@/shared/components/app-error-notice";
import { AppKeyValueRow } from "@/shared/components/app-key-value-row";
import { AppQueryState } from "@/shared/components/app-query-state";
import { AppScreen } from "@/shared/components/app-screen";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";
import { AsyncStateNotice } from "@/shared/components/async-state-notice";

const SUCCESS_NOTICE: Record<string, { title: string; description: string }> = {
  completed: {
    title: "Assinatura ativada!",
    description:
      "Recebemos a confirmacao do pagamento. Pode levar alguns segundos para a UI atualizar.",
  },
  opened: {
    title: "Checkout aberto no navegador",
    description:
      "Conclua o pagamento na janela do navegador e volte ao app para ver o estado atualizado.",
  },
};

/**
 * Canonical subscription screen composition for the mobile app.
 *
 * @returns Subscription state, available plans and hosted checkout entry.
 */
export function SubscriptionScreen(): ReactElement {
  const controller = useSubscriptionScreenController();

  return (
    <AppScreen>
      <CurrentSubscriptionCard controller={controller} />
      <TrialCallout controller={controller} />
      <CheckoutFeedback controller={controller} />
      <PlansCard controller={controller} />
    </AppScreen>
  );
}

interface ControllerProps {
  readonly controller: SubscriptionScreenController;
}

function CurrentSubscriptionCard({ controller }: ControllerProps): ReactElement {
  return (
    <AppSurfaceCard
      title="Sua assinatura"
      description="Plano atual, status e proxima cobranca."
    >
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
          <SubscriptionDetails
            subscription={subscription}
            onManage={controller.handleManageSubscription}
          />
        )}
      </AppQueryState>
    </AppSurfaceCard>
  );
}

interface SubscriptionDetailsProps {
  readonly subscription: SubscriptionState;
  readonly onManage: () => Promise<void>;
}

function SubscriptionDetails({
  subscription,
  onManage,
}: SubscriptionDetailsProps): ReactElement {
  return (
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
          label="Proxima cobranca"
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
        tone="secondary"
        onPress={() => {
          void onManage();
        }}
        testID="manage-subscription-button"
      >
        Gerenciar pelo navegador
      </AppButton>
    </YStack>
  );
}

function TrialCallout({ controller }: ControllerProps): ReactElement | null {
  if (!controller.trialOffer) {
    return null;
  }

  return (
    <AppSurfaceCard
      title="Experimente Premium"
      description={`Teste o ${controller.trialOffer.displayName} por ${controller.trialOffer.trialDays} dias sem custo.`}
    >
      <YStack gap="$3">
        <Paragraph color="$muted" fontFamily="$body" fontSize="$3">
          Sem cobranca no trial. Cancele a qualquer momento pelo Gerenciar pelo
          navegador.
        </Paragraph>
        {controller.trialError ? (
          <AppErrorNotice
            error={controller.trialError}
            fallbackTitle="Nao foi possivel iniciar o trial"
            fallbackDescription="Tente novamente em instantes."
            secondaryActionLabel="Fechar"
            onSecondaryAction={controller.dismissTrialError}
          />
        ) : null}
        <AppButton
          onPress={() => {
            void controller.handleStartTrial();
          }}
          disabled={controller.isStartingTrial}
          testID="start-trial-button"
        >
          {controller.isStartingTrial
            ? "Iniciando trial..."
            : "Iniciar trial gratuito"}
        </AppButton>
      </YStack>
    </AppSurfaceCard>
  );
}

function CheckoutFeedback({ controller }: ControllerProps): ReactElement | null {
  const router = useRouter();
  const outcome = controller.lastCheckoutOutcome;
  if (controller.checkoutError) {
    return (
      <AppErrorNotice
        error={controller.checkoutError}
        fallbackTitle="Nao foi possivel abrir o checkout"
        fallbackDescription="Tente novamente em alguns instantes."
        secondaryActionLabel="Fechar"
        onSecondaryAction={controller.dismissCheckoutError}
      />
    );
  }

  if (outcome === "opened" && SUCCESS_NOTICE.opened) {
    const copy = SUCCESS_NOTICE.opened;
    return (
      <AsyncStateNotice kind="empty" title={copy.title} description={copy.description} />
    );
  }

  if (outcome === "completed") {
    return (
      <CheckoutOutcomeCard
        outcome="completed"
        onPrimaryAction={() => {
          router.replace(appRoutes.private.dashboard);
        }}
      />
    );
  }

  if (outcome === "canceled" || outcome === "dismissed") {
    return (
      <CheckoutOutcomeCard
        outcome={outcome}
        onPrimaryAction={controller.dismissCheckoutError}
        onSecondaryAction={() => {
          router.back();
        }}
      />
    );
  }

  return null;
}

function PlansCard({ controller }: ControllerProps): ReactElement {
  return (
    <AppSurfaceCard
      title="Planos disponiveis"
      description="Compare beneficios e escolha o que faz sentido para voce."
    >
      <AppQueryState
        query={controller.plansQuery}
        options={{
          loading: {
            title: "Carregando planos",
            description: "Buscando catalogo de planos.",
          },
          empty: {
            title: "Sem planos publicados",
            description: "Volte mais tarde para ver as opcoes disponiveis.",
          },
          error: {
            fallbackTitle: "Nao foi possivel carregar os planos",
            fallbackDescription: "Tente novamente em instantes.",
          },
          isEmpty: () => controller.presentations.length === 0,
        }}
      >
        {() => (
          <YStack gap="$3">
            {controller.presentations.map((presentation) => (
              <BillingPlanCard
                key={presentation.plan.slug}
                presentation={presentation}
                onPress={() => {
                  void controller.handleSubscribe(presentation.plan);
                }}
                testID={`plan-card-${presentation.plan.slug}`}
              />
            ))}
            {controller.isStartingCheckout ? (
              <Paragraph color="$muted" fontFamily="$body" fontSize="$3">
                Abrindo checkout no navegador...
              </Paragraph>
            ) : null}
          </YStack>
        )}
      </AppQueryState>
    </AppSurfaceCard>
  );
}

