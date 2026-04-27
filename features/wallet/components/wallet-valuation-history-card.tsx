import type { ReactElement } from "react";

import { YStack } from "tamagui";

import { useWalletValuationHistoryQuery } from "@/features/wallet/hooks/use-wallet-query";
import { AppKeyValueRow } from "@/shared/components/app-key-value-row";
import { AppQueryState } from "@/shared/components/app-query-state";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";
import { formatCurrency } from "@/shared/utils/formatters";

const formatDate = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString("pt-BR");
};

export function WalletValuationHistoryCard(): ReactElement {
  const historyQuery = useWalletValuationHistoryQuery();
  return (
    <AppSurfaceCard
      title="Historico de valuation"
      description="Evolucao diaria do patrimonio investido."
    >
      <AppQueryState
        query={historyQuery}
        options={{
          loading: {
            title: "Carregando historico",
            description: "Buscando snapshots diarios.",
          },
          empty: {
            title: "Sem historico de valuation",
            description: "Adicione operacoes para gerar o historico.",
          },
          error: {
            fallbackTitle: "Nao foi possivel carregar o historico",
            fallbackDescription: "Tente novamente em instantes.",
          },
          isEmpty: (data) => data.history.length === 0,
        }}
      >
        {(response) => (
          <YStack gap="$2">
            {response.history.slice(-10).map((point) => (
              <AppKeyValueRow
                key={point.date}
                label={formatDate(point.date)}
                value={`${formatCurrency(point.totalValue)} · ${point.profitLossPercent.toFixed(2)}%`}
              />
            ))}
          </YStack>
        )}
      </AppQueryState>
    </AppSurfaceCard>
  );
}
