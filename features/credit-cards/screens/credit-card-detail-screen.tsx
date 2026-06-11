import { type ReactElement } from "react";

import { Paragraph, XStack, YStack } from "tamagui";

import type {
  CreditCard,
  CreditCardUtilizationRecord,
} from "@/features/credit-cards/contracts";
import {
  useCreditCardDetailScreenController,
  type CreditCardDetailScreenController,
} from "@/features/credit-cards/hooks/use-credit-card-detail-screen-controller";
import { AppBadge } from "@/shared/components/app-badge";
import { AppButton } from "@/shared/components/app-button";
import { AppEmptyState } from "@/shared/components/app-empty-state";
import { AppKeyValueRow } from "@/shared/components/app-key-value-row";
import { AppQueryState } from "@/shared/components/app-query-state";
import { AppScreen } from "@/shared/components/app-screen";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";
import { formatCurrency } from "@/shared/utils/formatters";

const dash = (value: string | number | null | undefined): string =>
  value === null || value === undefined || value === "" ? "-" : `${value}`;

/**
 * Credit card detail screen (parity with the web `credit-cards/[id]` page):
 * card info (brand/bank/limit/cycle), a missing-cycle warning, limit
 * utilization and quick access to the bill.
 */
export function CreditCardDetailScreen(): ReactElement {
  const controller = useCreditCardDetailScreenController();

  if (controller.creditCardsQuery.isLoading && controller.creditCard === null) {
    return (
      <AppScreen>
        <AppSurfaceCard title="Carregando cartao" description="Buscando dados.">
          <Paragraph color="$muted" fontFamily="$body" fontSize="$3">
            Aguarde um instante.
          </Paragraph>
        </AppSurfaceCard>
      </AppScreen>
    );
  }

  if (controller.notFound || controller.creditCard === null) {
    return (
      <AppScreen>
        <AppEmptyState
          illustration="transactions"
          title="Cartao nao encontrado"
          description="Esse cartao nao existe ou foi removido."
          cta={{ label: "Voltar", onPress: controller.handleBack }}
        />
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <CreditCardDetailContent
        controller={controller}
        creditCard={controller.creditCard}
      />
    </AppScreen>
  );
}

interface CreditCardDetailContentProps {
  readonly controller: CreditCardDetailScreenController;
  readonly creditCard: CreditCard;
}

function CreditCardDetailContent({
  controller,
  creditCard,
}: CreditCardDetailContentProps): ReactElement {
  return (
    <YStack gap="$3">
      <AppButton tone="secondary" onPress={controller.handleBack}>
        Voltar
      </AppButton>

      <AppSurfaceCard
        title={creditCard.name}
        description={creditCard.bank ?? "Cartao de credito"}
      >
        <YStack gap="$3">
          <XStack gap="$2" flexWrap="wrap">
            {creditCard.brand ? (
              <AppBadge tone="default">{creditCard.brand}</AppBadge>
            ) : null}
            {creditCard.lastFourDigits ? (
              <AppBadge tone="default">{`final ${creditCard.lastFourDigits}`}</AppBadge>
            ) : null}
          </XStack>
          <AppKeyValueRow
            label="Limite"
            value={
              creditCard.limitAmount !== null
                ? formatCurrency(creditCard.limitAmount)
                : "-"
            }
          />
          <AppKeyValueRow label="Fechamento" value={dash(creditCard.closingDay)} />
          <AppKeyValueRow label="Vencimento" value={dash(creditCard.dueDay)} />
        </YStack>
      </AppSurfaceCard>

      {controller.hasCycleConfig ? (
        <UtilizationCard controller={controller} />
      ) : (
        <AppSurfaceCard
          title="Ciclo nao configurado"
          description="Defina o dia de fechamento e de vencimento para ver fatura e utilizacao."
        >
          <AppBadge tone="danger">Acao necessaria</AppBadge>
        </AppSurfaceCard>
      )}

      <AppButton onPress={controller.handleViewBill} disabled={!controller.hasCycleConfig}>
        Ver fatura
      </AppButton>
    </YStack>
  );
}

interface UtilizationCardProps {
  readonly controller: CreditCardDetailScreenController;
}

function UtilizationCard({ controller }: UtilizationCardProps): ReactElement {
  return (
    <AppSurfaceCard
      title="Utilizacao do limite"
      description="Quanto do limite ja esta comprometido no ciclo atual."
    >
      <AppQueryState
        query={controller.utilizationQuery}
        options={{
          loading: { title: "Calculando utilizacao" },
          loadingPresentation: "notice",
          empty: { title: "Sem dados de utilizacao" },
          error: { fallbackTitle: "Nao foi possivel calcular a utilizacao" },
        }}
      >
        {(utilization) => <UtilizationBody utilization={utilization} />}
      </AppQueryState>
    </AppSurfaceCard>
  );
}

interface UtilizationBodyProps {
  readonly utilization: CreditCardUtilizationRecord;
}

function UtilizationBody({ utilization }: UtilizationBodyProps): ReactElement {
  const pct = utilization.utilizationPct ?? 0;
  const width = Math.min(100, Math.max(0, pct));
  const color = pct >= 90 ? "$danger" : pct >= 70 ? "$muted" : "$primary";
  return (
    <YStack gap="$3">
      <XStack alignItems="center" justifyContent="space-between">
        <Paragraph color="$muted" fontFamily="$body" fontSize="$2">
          Comprometido
        </Paragraph>
        <Paragraph color="$color" fontFamily="$heading" fontSize="$5">
          {pct.toFixed(1)}%
        </Paragraph>
      </XStack>
      <YStack
        height={10}
        borderRadius="$10"
        backgroundColor="$backgroundPress"
        overflow="hidden"
        accessibilityRole="progressbar"
        accessibilityValue={{ now: Math.round(width), min: 0, max: 100 }}
      >
        <YStack height="100%" width={`${width}%`} backgroundColor={color} />
      </YStack>
      <AppKeyValueRow
        label="Comprometido"
        value={formatCurrency(utilization.committedAmount)}
      />
      <AppKeyValueRow
        label="Disponivel"
        value={
          utilization.availableAmount !== null
            ? formatCurrency(utilization.availableAmount)
            : "-"
        }
      />
    </YStack>
  );
}
