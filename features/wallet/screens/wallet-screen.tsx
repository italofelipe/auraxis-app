import type { ReactElement } from "react";

import { Paragraph, XStack, YStack } from "tamagui";

import { useWalletScreenController } from "@/features/wallet/hooks/use-wallet-screen-controller";
import { AppKeyValueRow } from "@/shared/components/app-key-value-row";
import { AppQueryState } from "@/shared/components/app-query-state";
import { AppScreen } from "@/shared/components/app-screen";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";
import { formatCurrency, formatPercent } from "@/shared/utils/formatters";

/**
 * Canonical wallet screen composition for the mobile app.
 *
 * @returns Portfolio summary with asset allocation rows.
 */
export function WalletScreen(): ReactElement {
  const controller = useWalletScreenController();

  return (
    <AppScreen>
      <AppSurfaceCard title="Carteira" description="Distribuicao atual do patrimonio.">
        <AppQueryState
          query={controller.walletQuery}
          options={{
            loading: {
              title: "Carregando carteira",
              description: "Buscando os ativos registrados para o usuario.",
            },
            empty: {
              title: "Nenhum ativo encontrado",
              description: "Os ativos adicionados vao aparecer aqui.",
            },
            error: {
              fallbackTitle: "Nao foi possivel carregar a carteira",
              fallbackDescription: "Tente novamente em instantes.",
            },
            isEmpty: (data) => data.items.length === 0,
          }}
        >
          {() => (
            <YStack gap="$3">
              <Paragraph color="$color" fontFamily="$heading" fontSize="$8">
                Total: {formatCurrency(controller.total)}
              </Paragraph>

              {controller.assets.map((asset) => (
                <AppKeyValueRow
                  key={asset.id}
                  label={asset.name}
                  value={
                    <XStack alignItems="center" gap="$2">
                      <Paragraph color="$color" fontFamily="$body" fontSize="$4">
                        {formatCurrency(asset.amount)}
                      </Paragraph>
                      <Paragraph color="$muted" fontFamily="$body" fontSize="$3">
                        {formatPercent(asset.allocation)}
                      </Paragraph>
                    </XStack>
                  }
                />
              ))}
            </YStack>
          )}
        </AppQueryState>
      </AppSurfaceCard>
    </AppScreen>
  );
}
