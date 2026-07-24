import type { ReactElement } from "react";

import { useRouter } from "expo-router";
import { Paragraph, YStack } from "tamagui";

import { appRoutes } from "@/core/navigation/routes";
import { BillingPlanCard } from "@/features/subscription/components/billing-plan-card";
import { CheckoutOutcomeCard } from "@/features/subscription/components/checkout-outcome-card";
import { SubscriptionCancelModal } from "@/features/subscription/components/subscription-cancel-modal";
import {
  useSubscriptionScreenController,
  type SubscriptionScreenController,
} from "@/features/subscription/hooks/use-subscription-screen-controller";
import type {
  SubscriptionState,
  SubscriptionStatus,
} from "@/features/subscription/contracts";
import type { SubscriptionManagementAction } from "@/features/subscription/services/subscription-management";
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
    title: "Checkout aberto",
    description:
      "Conclua o pagamento e volte ao app para ver o estado atualizado.",
  },
};

const STATUS_LABELS: Record<SubscriptionStatus, string> = {
  free: "Gratuito",
  trialing: "Periodo gratuito",
  active: "Ativa",
  past_due: "Pagamento pendente",
  canceled: "Cancelada",
  expired: "Expirada",
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
      <CancellationFeedback controller={controller} />
      <TrialCallout controller={controller} />
      <CheckoutFeedback controller={controller} />
      <PlansCard controller={controller} />
      <SubscriptionCancelModal
        visible={controller.isCancelConfirmationOpen}
        currentPeriodEnd={controller.subscription?.currentPeriodEnd ?? null}
        isSubmitting={controller.isCancelingSubscription}
        error={controller.cancelError}
        onConfirm={() => {
          void controller.handleCancelSubscription();
        }}
        onClose={controller.closeCancelConfirmation}
      />
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
            managementAction={controller.managementAction}
            managementError={controller.managementError}
            onManage={controller.handleManageSubscription}
            onDismissManagementError={controller.dismissManagementError}
          />
        )}
      </AppQueryState>
    </AppSurfaceCard>
  );
}

interface SubscriptionDetailsProps {
  readonly subscription: SubscriptionState;
  readonly managementAction: SubscriptionManagementAction | null;
  readonly managementError: unknown | null;
  readonly onManage: () => Promise<void>;
  readonly onDismissManagementError: () => void;
}

function SubscriptionDetails({
  subscription,
  managementAction,
  managementError,
  onManage,
  onDismissManagementError,
}: SubscriptionDetailsProps): ReactElement {
  const periodEndLabel =
    subscription.status === "canceled" ? "Acesso ate" : "Proxima cobranca";

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
            {STATUS_LABELS[subscription.status]}
          </AppBadge>
        }
      />
      {subscription.currentPeriodEnd ? (
        <AppKeyValueRow
          label={periodEndLabel}
          value={new Date(subscription.currentPeriodEnd).toLocaleDateString("pt-BR")}
        />
      ) : null}
      {subscription.trialEndsAt ? (
        <AppKeyValueRow
          label="Trial ate"
          value={new Date(subscription.trialEndsAt).toLocaleDateString("pt-BR")}
        />
      ) : null}
      {subscription.canceledAt ? (
        <AppKeyValueRow
          label="Cancelada em"
          value={new Date(subscription.canceledAt).toLocaleDateString("pt-BR")}
        />
      ) : null}
      {managementError ? (
        <AppErrorNotice
          error={managementError}
          fallbackTitle="Nao foi possivel abrir a gestao da assinatura"
          fallbackDescription="Tente novamente ou use a pagina Web da Auraxis."
          actionLabel="Tentar novamente"
          onAction={() => {
            void onManage();
          }}
          secondaryActionLabel="Fechar"
          onSecondaryAction={onDismissManagementError}
          testID="subscription-management-error"
        />
      ) : null}
      {managementAction ? (
        <>
          <Paragraph color="$muted" fontFamily="$body" fontSize="$3">
            {managementAction.description}
          </Paragraph>
          <AppButton
            tone={managementAction.mode === "api" ? "danger" : "secondary"}
            onPress={() => {
              void onManage();
            }}
            testID="manage-subscription-button"
          >
            {managementAction.label}
          </AppButton>
        </>
      ) : null}
    </YStack>
  );
}

function CancellationFeedback({
  controller,
}: ControllerProps): ReactElement | null {
  const canceledSubscription = controller.lastCanceledSubscription;
  if (!canceledSubscription) {
    return null;
  }

  const description = canceledSubscription.currentPeriodEnd
    ? `A renovacao foi interrompida. Seu acesso continua ate ${new Date(
        canceledSubscription.currentPeriodEnd,
      ).toLocaleDateString("pt-BR")}.`
    : "A renovacao foi interrompida. O estado atualizado ja foi sincronizado.";

  return (
    <AppSurfaceCard title="Assinatura cancelada" description={description}>
      <AppButton
        tone="secondary"
        onPress={controller.dismissCancellationFeedback}
        testID="dismiss-cancellation-feedback"
      >
        Entendi
      </AppButton>
    </AppSurfaceCard>
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
          Sem cobranca no trial. Cancele a qualquer momento em Gerenciar
          assinatura.
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
                Abrindo checkout...
              </Paragraph>
            ) : null}
          </YStack>
        )}
      </AppQueryState>
    </AppSurfaceCard>
  );
}
