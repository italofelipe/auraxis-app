import { useRouter } from "expo-router";
import type { ReactElement } from "react";

import { Paragraph, XStack, YStack } from "tamagui";

import { appRoutes } from "@/core/navigation/routes";
import { WalletEntryForm } from "@/features/wallet/components/wallet-entry-form";
import { WalletValuationCard } from "@/features/wallet/components/wallet-valuation-card";
import { WalletValuationHistoryCard } from "@/features/wallet/components/wallet-valuation-history-card";
import {
  useWalletScreenController,
  type WalletAssetSummary,
  type WalletScreenController,
} from "@/features/wallet/hooks/use-wallet-screen-controller";
import { AppButton } from "@/shared/components/app-button";
import { AppKeyValueRow } from "@/shared/components/app-key-value-row";
import { AppEmptyState } from "@/shared/components/app-empty-state";
import { AppQueryState } from "@/shared/components/app-query-state";
import { WalletEntryListSkeleton } from "@/shared/skeletons";
import { AppScreen } from "@/shared/components/app-screen";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";
import { formatCurrency, formatPercent } from "@/shared/utils/formatters";

const formatChangePercent = (value: number): string => {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
};

/**
 * Canonical wallet screen composition for the mobile app.
 *
 * @returns Portfolio summary with create/edit/delete actions or active form.
 */
export function WalletScreen(): ReactElement {
  const controller = useWalletScreenController();
  const router = useRouter();
  const handleOpenOperations = (entryId: string): void => {
    router.push({
      pathname: appRoutes.private.walletOperations,
      params: { entryId },
    });
  };

  if (controller.formMode.kind !== "closed") {
    return (
      <AppScreen>
        <WalletEntryForm
          initialEntry={
            controller.formMode.kind === "edit" ? controller.formMode.entry : null
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
      <WalletValuationCard />
      <WalletValuationHistoryCard />
      <AssetsListCard
        controller={controller}
        onOpenOperations={handleOpenOperations}
      />
    </AppScreen>
  );
}

interface ControllerProps {
  readonly controller: WalletScreenController;
}

function SummaryCard({ controller }: ControllerProps): ReactElement {
  const baseTotal = controller.total;
  const liveTotal = controller.liveTotal;
  const showLive = liveTotal !== null && liveTotal !== baseTotal;
  const refreshLabel = controller.isRefreshingQuotes
    ? "Atualizando…"
    : "Atualizar cotacoes";
  return (
    <AppSurfaceCard
      title="Carteira"
      description="Distribuicao atual do patrimonio."
    >
      <YStack gap="$3">
        <Paragraph color="$color" fontFamily="$heading" fontSize="$8">
          Total: {formatCurrency(showLive ? (liveTotal as number) : baseTotal)}
        </Paragraph>
        {showLive ? (
          <Paragraph color="$muted" fontFamily="$body" fontSize="$3">
            Valor de aporte: {formatCurrency(baseTotal)} • cotacoes em tempo real
          </Paragraph>
        ) : null}
        {controller.liveQuotes.hasAnyError ? (
          <Paragraph color="$danger" fontFamily="$body" fontSize="$3">
            Algumas cotacoes nao puderam ser carregadas.
          </Paragraph>
        ) : null}
        <XStack gap="$2" flexWrap="wrap">
          <AppButton onPress={controller.handleOpenCreate}>Novo ativo</AppButton>
          <AppButton
            tone="secondary"
            onPress={() => {
              void controller.handleRefreshQuotes();
            }}
            disabled={controller.isRefreshingQuotes}
          >
            {refreshLabel}
          </AppButton>
        </XStack>
      </YStack>
    </AppSurfaceCard>
  );
}

interface AssetsListCardProps extends ControllerProps {
  readonly onOpenOperations: (entryId: string) => void;
}

function AssetsListCard({
  controller,
  onOpenOperations,
}: AssetsListCardProps): ReactElement {
  return (
    <AppSurfaceCard
      title="Ativos"
      description="Itens registrados na sua carteira."
    >
      <AppQueryState
        query={controller.walletQuery}
        options={{
          loading: {
            title: "Carregando carteira",
            description: "Buscando ativos registrados.",
          },
          empty: {
            title: "Nenhum ativo encontrado",
            description: "Adicione um ativo para comecar.",
          },
          error: {
            fallbackTitle: "Nao foi possivel carregar a carteira",
            fallbackDescription: "Tente novamente em instantes.",
          },
          isEmpty: () => controller.entries.length === 0,
        }}
        loadingComponent={<WalletEntryListSkeleton rows={4} />}
        emptyComponent={
          <AppEmptyState
            illustration="wallet"
            title="Sua carteira esta vazia"
            description="Adicione seus primeiros ativos para acompanhar evolucao patrimonial."
            cta={{ label: "Adicionar ativo", onPress: controller.handleOpenCreate }}
          />
        }
      >
        {() => (
          <YStack gap="$3">
            {controller.assets.map((asset) => {
              const entry = controller.entries.find((item) => item.id === asset.id);
              if (!entry) {
                return null;
              }
              return (
                <WalletAssetRow
                  key={asset.id}
                  asset={asset}
                  isDeleting={controller.deletingEntryId === asset.id}
                  onEdit={() => controller.handleOpenEdit(entry)}
                  onDelete={() => {
                    void controller.handleDelete(asset.id);
                  }}
                  onOpenOperations={() => onOpenOperations(asset.id)}
                />
              );
            })}
          </YStack>
        )}
      </AppQueryState>
    </AppSurfaceCard>
  );
}

interface WalletAssetRowProps {
  readonly asset: WalletAssetSummary;
  readonly isDeleting: boolean;
  readonly onEdit: () => void;
  readonly onDelete: () => void;
  readonly onOpenOperations: () => void;
}

function WalletAssetRow({
  asset,
  isDeleting,
  onEdit,
  onDelete,
  onOpenOperations,
}: WalletAssetRowProps): ReactElement {
  const liveAmount = asset.liveAmount;
  const showLiveAmount = liveAmount !== null;
  return (
    <YStack gap="$2">
      <AppKeyValueRow
        label={asset.name}
        value={
          <XStack alignItems="center" gap="$2">
            <Paragraph color="$color" fontFamily="$body" fontSize="$4">
              {formatCurrency(showLiveAmount ? (liveAmount as number) : asset.amount)}
            </Paragraph>
            <Paragraph color="$muted" fontFamily="$body" fontSize="$3">
              {formatPercent(asset.allocation)}
            </Paragraph>
          </XStack>
        }
      />
      <TickerLine asset={asset} />
      <XStack gap="$2" flexWrap="wrap">
        <AppButton tone="secondary" onPress={onOpenOperations} disabled={isDeleting}>
          Ver operacoes
        </AppButton>
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

interface TickerLineProps {
  readonly asset: WalletAssetSummary;
}

function TickerLine({ asset }: TickerLineProps): ReactElement | null {
  if (!asset.ticker) {
    return null;
  }
  const change = asset.liveChangePercent;
  const trendTone =
    change === null || change === 0
      ? "$muted"
      : change > 0
        ? "$success"
        : "$danger";
  const trendIcon =
    change === null || change === 0 ? "•" : change > 0 ? "▲" : "▼";
  const showChange = change !== null && !asset.hasQuoteError;
  return (
    <XStack gap="$2" alignItems="center">
      <Paragraph color="$muted" fontFamily="$body" fontSize="$3">
        {asset.ticker.toUpperCase()}
      </Paragraph>
      {asset.isQuoteLoading ? (
        <Paragraph color="$muted" fontFamily="$body" fontSize="$3">
          · carregando cotacao…
        </Paragraph>
      ) : null}
      {asset.hasQuoteError ? (
        <Paragraph color="$danger" fontFamily="$body" fontSize="$3">
          · cotacao indisponivel
        </Paragraph>
      ) : null}
      {showChange ? (
        <Paragraph color={trendTone} fontFamily="$body" fontSize="$3">
          {trendIcon} {formatChangePercent(change as number)}
        </Paragraph>
      ) : null}
    </XStack>
  );
}
