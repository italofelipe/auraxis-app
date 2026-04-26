import type { ReactElement } from "react";

import { Paragraph, XStack, YStack } from "tamagui";

import { CreditCardForm } from "@/features/credit-cards/components/credit-card-form";
import type { CreditCard } from "@/features/credit-cards/contracts";
import {
  useCreditCardsScreenController,
  type CreditCardsScreenController,
} from "@/features/credit-cards/hooks/use-credit-cards-screen-controller";
import { AppButton } from "@/shared/components/app-button";
import { AppKeyValueRow } from "@/shared/components/app-key-value-row";
import { AppQueryState } from "@/shared/components/app-query-state";
import { AppScreen } from "@/shared/components/app-screen";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";
import { formatCurrency } from "@/shared/utils/formatters";

export function CreditCardsScreen(): ReactElement {
  const controller = useCreditCardsScreenController();

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
      <CreditCardsListCard controller={controller} />
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

function CreditCardsListCard({ controller }: ControllerProps): ReactElement {
  return (
    <AppSurfaceCard
      title="Lista de cartoes"
      description="Cartoes registrados para o usuario."
    >
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
              <CreditCardRow
                key={creditCard.id}
                creditCard={creditCard}
                isDeleting={controller.deletingCreditCardId === creditCard.id}
                onEdit={() => controller.handleOpenEdit(creditCard)}
                onDelete={() => {
                  void controller.handleDelete(creditCard.id);
                }}
              />
            ))}
          </YStack>
        )}
      </AppQueryState>
    </AppSurfaceCard>
  );
}

interface CreditCardRowProps {
  readonly creditCard: CreditCard;
  readonly isDeleting: boolean;
  readonly onEdit: () => void;
  readonly onDelete: () => void;
}

function CreditCardRow({
  creditCard,
  isDeleting,
  onEdit,
  onDelete,
}: CreditCardRowProps): ReactElement {
  const last = creditCard.lastFourDigits ? ` · ****${creditCard.lastFourDigits}` : "";
  return (
    <YStack gap="$2">
      <AppKeyValueRow
        label={`${creditCard.name}${last}`}
        value={
          <YStack alignItems="flex-end" gap="$1">
            {creditCard.limitAmount !== null ? (
              <Paragraph color="$color" fontFamily="$body" fontSize="$4">
                {formatCurrency(creditCard.limitAmount)}
              </Paragraph>
            ) : null}
            {creditCard.brand ? (
              <Paragraph color="$muted" fontFamily="$body" fontSize="$3">
                {creditCard.brand}
              </Paragraph>
            ) : null}
          </YStack>
        }
      />
      <XStack gap="$2" flexWrap="wrap">
        <AppButton tone="secondary" onPress={onEdit} disabled={isDeleting}>
          Editar
        </AppButton>
        <AppButton tone="secondary" onPress={onDelete} disabled={isDeleting}>
          {isDeleting ? "Excluindo..." : "Excluir"}
        </AppButton>
      </XStack>
    </YStack>
  );
}
