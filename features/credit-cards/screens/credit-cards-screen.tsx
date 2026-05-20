import type { ReactElement } from "react";

import { useRouter } from "expo-router";
import { YStack } from "tamagui";

import { appRoutes, buildCreditCardBillPath } from "@/core/navigation/routes";
import { CreditCardCard } from "@/features/credit-cards/components/credit-card-card";
import { CreditCardForm } from "@/features/credit-cards/components/credit-card-form";
import {
  useCreditCardsScreenController,
  type CreditCardsScreenController,
} from "@/features/credit-cards/hooks/use-credit-cards-screen-controller";
import { AiInsightSurface } from "@/features/insights/components/ai-insight-surface";
import { AppButton } from "@/shared/components/app-button";
import { AppQueryState } from "@/shared/components/app-query-state";
import { AppScreen } from "@/shared/components/app-screen";
import { AppSectionHeader } from "@/shared/components/app-section-header";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";

export function CreditCardsScreen(): ReactElement {
  const controller = useCreditCardsScreenController();
  const router = useRouter();

  if (controller.formMode.kind !== "closed") {
    return (
      <AppScreen>
        <CreditCardForm
          initialCreditCard={
            controller.formMode.kind === "edit"
              ? controller.formMode.creditCard
              : null
          }
          isSubmitting={controller.isSubmitting}
          submitError={controller.submitError}
          onSubmit={controller.handleSubmit}
          onCancel={controller.handleCloseForm}
          onDismissError={controller.dismissSubmitError}
        />
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <SummaryCard controller={controller} />
      <AiInsightSurface
        dimension="credit_cards"
        onOpenHub={() => router.push(appRoutes.private.insights)}
      />
      <CreditCardsListSection
        controller={controller}
        onViewBill={(creditCardId) => {
          router.push(buildCreditCardBillPath(creditCardId));
        }}
      />
    </AppScreen>
  );
}

interface ControllerProps {
  readonly controller: CreditCardsScreenController;
}

function SummaryCard({ controller }: ControllerProps): ReactElement {
  return (
    <AppSurfaceCard
      title="Cartoes de credito"
      description="Cartoes ativos e seus parametros."
    >
      <YStack gap="$3">
        <AppButton onPress={controller.handleOpenCreate}>Novo cartao</AppButton>
      </YStack>
    </AppSurfaceCard>
  );
}

interface CreditCardsListSectionProps extends ControllerProps {
  readonly onViewBill: (creditCardId: string) => void;
}

function CreditCardsListSection({
  controller,
  onViewBill,
}: CreditCardsListSectionProps): ReactElement {
  return (
    <YStack gap="$3">
      <AppSectionHeader
        title="Lista de cartoes"
        description="Cartoes registrados para o usuario."
      />
      <AppQueryState
        query={controller.creditCardsQuery}
        options={{
          loading: {
            title: "Carregando cartoes",
            description: "Buscando cartoes registrados.",
          },
          empty: {
            title: "Nenhum cartao registrado",
            description: "Crie o primeiro cartao para classificar despesas.",
          },
          error: {
            fallbackTitle: "Nao foi possivel carregar os cartoes",
            fallbackDescription: "Tente novamente em instantes.",
          },
          isEmpty: () => controller.creditCards.length === 0,
        }}
      >
        {() => (
          <YStack gap="$3">
            {controller.creditCards.map((creditCard) => (
              <CreditCardCard
                key={creditCard.id}
                creditCard={creditCard}
                isDeleting={controller.deletingCreditCardId === creditCard.id}
                onEdit={() => controller.handleOpenEdit(creditCard)}
                onDelete={() => {
                  void controller.handleDelete(creditCard.id);
                }}
                onViewBill={() => onViewBill(creditCard.id)}
              />
            ))}
          </YStack>
        )}
      </AppQueryState>
    </YStack>
  );
}
