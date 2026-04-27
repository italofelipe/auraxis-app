import { useRouter } from "expo-router";
import type { ReactElement } from "react";

import { Paragraph, XStack, YStack } from "tamagui";

import { appRoutes } from "@/core/navigation/routes";
import { WalletEntryForm } from "@/features/wallet/components/wallet-entry-form";
import { WalletValuationCard } from "@/features/wallet/components/wallet-valuation-card";
import { WalletValuationHistoryCard } from "@/features/wallet/components/wallet-valuation-history-card";
import {
  useWalletScreenController,
  type WalletScreenController,
} from "@/features/wallet/hooks/use-wallet-screen-controller";
import { AppButton } from "@/shared/components/app-button";
import { AppKeyValueRow } from "@/shared/components/app-key-value-row";
import { AppQueryState } from "@/shared/components/app-query-state";
import { AppScreen } from "@/shared/components/app-screen";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";
import { formatCurrency, formatPercent } from "@/shared/utils/formatters";

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
  return (
    <AppSurfaceCard
      title="Carteira"
      description="Distribuicao atual do patrimonio."
    >
      <YStack gap="$3">
        <Paragraph color="$color" fontFamily="$heading" fontSize="$8">
          Total: {formatCurrency(controller.total)}
        </Paragraph>
        <AppButton onPress={controller.handleOpenCreate}>Novo ativo</AppButton>
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
                  name={asset.name}
                  amount={asset.amount}
                  allocation={asset.allocation}
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
  readonly name: string;
  readonly amount: number;
  readonly allocation: number;
  readonly isDeleting: boolean;
  readonly onEdit: () => void;
  readonly onDelete: () => void;
  readonly onOpenOperations: () => void;
}

function WalletAssetRow({
  name,
  amount,
  allocation,
  isDeleting,
  onEdit,
  onDelete,
  onOpenOperations,
}: WalletAssetRowProps): ReactElement {
  return (
    <YStack gap="$2">
      <AppKeyValueRow
        label={name}
        value={
          <XStack alignItems="center" gap="$2">
            <Paragraph color="$color" fontFamily="$body" fontSize="$4">
              {formatCurrency(amount)}
            </Paragraph>
            <Paragraph color="$muted" fontFamily="$body" fontSize="$3">
              {formatPercent(allocation)}
            </Paragraph>
          </XStack>
        }
      />
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
