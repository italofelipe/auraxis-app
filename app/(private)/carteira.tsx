import { Paragraph, XStack, YStack } from "tamagui";

import { useWalletScreenController } from "@/features/wallet/hooks/use-wallet-screen-controller";
import { AppKeyValueRow } from "@/shared/components/app-key-value-row";
import { AppScreen } from "@/shared/components/app-screen";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";
import { AsyncStateNotice } from "@/shared/components/async-state-notice";
import { formatCurrency, formatPercent } from "@/shared/utils/formatters";

export default function WalletScreen() {
  const controller = useWalletScreenController();

  return (
    <AppScreen>
      <AppSurfaceCard title="Carteira" description="Distribuicao atual do patrimonio.">
        {controller.walletQuery.isPending ? (
          <AsyncStateNotice
            kind="loading"
            title="Carregando carteira"
            description="Buscando os ativos registrados para o usuario."
          />
        ) : controller.walletQuery.isError ? (
          <AsyncStateNotice
            kind="error"
            title="Nao foi possivel carregar a carteira"
            description="Tente novamente em instantes."
          />
        ) : (
          <YStack gap="$3">
            <Paragraph color="$color" fontFamily="$heading" fontSize="$8">
              Total: {formatCurrency(controller.total)}
            </Paragraph>

            {controller.assets.length === 0 ? (
              <AsyncStateNotice
                kind="empty"
                title="Nenhum ativo encontrado"
                description="Os ativos adicionados vao aparecer aqui."
              />
            ) : (
              controller.assets.map((asset) => (
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
              ))
            )}
          </YStack>
        )}
      </AppSurfaceCard>
    </AppScreen>
  );
}
