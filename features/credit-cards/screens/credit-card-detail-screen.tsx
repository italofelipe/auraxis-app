import { type ReactElement } from "react";

import { ScrollView, YStack } from "tamagui";

import type { CreditCard } from "@/features/credit-cards/contracts";
import { CardAppBar, CardAppBarButton } from "@/features/credit-cards/components/card-app-bar";
import { CardEvolution } from "@/features/credit-cards/components/card-evolution";
import { CardFace } from "@/features/credit-cards/components/card-face";
import { CardLimitBlock } from "@/features/credit-cards/components/card-limit-block";
import {
  CardQuickActions,
  type CardQuickAction,
} from "@/features/credit-cards/components/card-quick-actions";
import { CardRecentTransactions } from "@/features/credit-cards/components/card-recent-transactions";
import { CardStickyCta } from "@/features/credit-cards/components/card-sticky-cta";
import { CardTopCategories } from "@/features/credit-cards/components/card-top-categories";
import {
  useCreditCardDetailScreenController,
  type CreditCardDetailScreenController,
} from "@/features/credit-cards/hooks/use-credit-card-detail-screen-controller";
import type { CreditCardDetailViewModel } from "@/features/credit-cards/model/credit-card-detail";
import { AppEmptyState } from "@/shared/components/app-empty-state";
import { AppScreen } from "@/shared/components/app-screen";
import { AppSkeletonBlock } from "@/shared/components/app-skeleton-block";

/**
 * Tela "Detalhe do cartão" redesenhada: AppBar (voltar + nome + emissor·bandeira
 * + menu), face grande do cartão, ações rápidas, bloco de limite (anel +
 * linhas), evolução da fatura, top categorias, lançamentos recentes e um CTA
 * fixo "Ver fatura completa". View-only — toda derivação vem do controller.
 *
 * @returns Tela de detalhe do cartão.
 */
export function CreditCardDetailScreen(): ReactElement {
  const controller = useCreditCardDetailScreenController();

  if (controller.creditCardsQuery.isLoading && controller.creditCard === null) {
    return (
      <AppScreen testID="credit-card-detail-screen">
        <AppSkeletonBlock title="Carregando cartão" lines={6} />
      </AppScreen>
    );
  }

  if (controller.notFound || controller.creditCard === null || controller.detail === null) {
    return (
      <AppScreen testID="credit-card-detail-screen">
        <CardAppBar title="Cartão" onBack={controller.handleBack} />
        <AppEmptyState
          illustration="transactions"
          title="Cartão não encontrado"
          description="Esse cartão não existe ou foi removido."
          cta={{ label: "Voltar", onPress: controller.handleBack }}
        />
      </AppScreen>
    );
  }

  return (
    <AppScreen scrollable={false} testID="credit-card-detail-screen">
      <CardAppBar
        title={controller.creditCard.name}
        subtitle={controller.detail.subtitle}
        onBack={controller.handleBack}
        right={
          <CardAppBarButton
            icon="dots-horizontal"
            accessibilityLabel="Mais ações"
            onPress={controller.handleOpenSettings}
            testID="card-detail-menu"
          />
        }
      />
      <CreditCardDetailBody
        controller={controller}
        creditCard={controller.creditCard}
        detail={controller.detail}
      />
      <CardStickyCta
        label="Ver fatura completa"
        icon="chevron-right"
        onPress={controller.handleViewBill}
        testID="card-detail-cta"
      />
    </AppScreen>
  );
}

interface CreditCardDetailBodyProps {
  readonly controller: CreditCardDetailScreenController;
  readonly creditCard: CreditCard;
  readonly detail: CreditCardDetailViewModel;
}

function CreditCardDetailBody({
  controller,
  creditCard,
  detail,
}: CreditCardDetailBodyProps): ReactElement {
  const quickActions: readonly CardQuickAction[] = [
    {
      key: "launch",
      icon: "credit-card-plus-outline",
      label: "Lançar",
      onPress: controller.handleLaunchExpense,
    },
    {
      key: "invoice",
      icon: "file-document-outline",
      label: "Fatura",
      onPress: controller.handleViewBill,
    },
    {
      key: "block",
      icon: "lock-outline",
      label: "Bloquear",
      onPress: controller.handleBlockCard,
    },
    {
      key: "settings",
      icon: "cog-outline",
      label: "Ajustes",
      onPress: controller.handleOpenSettings,
    },
  ];

  return (
    <ScrollView
      flex={1}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ gap: 16, paddingTop: 16, paddingBottom: 16 }}
    >
      <YStack alignItems="center">
        <CardFace
          card={creditCard}
          currentBillTotal={detail.currentBillTotal}
          usagePct={detail.limit.usedPct}
        />
      </YStack>

      <CardQuickActions actions={quickActions} />
      <CardLimitBlock limit={detail.limit} />
      <CardEvolution points={detail.evolution} color={detail.gradient.colors[0]} />
      <CardTopCategories categories={detail.topCategories} />
      <CardRecentTransactions
        transactions={detail.recentTransactions}
        onSeeInvoice={controller.handleViewBill}
      />
    </ScrollView>
  );
}
