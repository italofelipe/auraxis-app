import type { ReactElement } from "react";

import { useWalletValuationQuery } from "@/features/wallet/hooks/use-wallet-query";
import { AppKeyValueRow } from "@/shared/components/app-key-value-row";
import { AppQueryState } from "@/shared/components/app-query-state";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";
import { formatCurrency } from "@/shared/utils/formatters";

export function WalletValuationCard(): ReactElement {
  const valuationQuery = useWalletValuationQuery();
  return (
    <AppSurfaceCard
      title="Valuation"
      description="Valor de mercado e retorno consolidado da carteira."
    >
      <AppQueryState
        query={valuationQuery}
        options={{
          loading: {
            title: "Carregando valuation",
            description: "Buscando cotacoes mais recentes.",
          },
          empty: {
            title: "Sem dados de valuation",
            description: "Adicione ativos para ver o valor de mercado.",
          },
          error: {
            fallbackTitle: "Nao foi possivel calcular a valuation",
            fallbackDescription: "Tente novamente em instantes.",
          },
        }}
      >
        {(valuation) => (
          <>
            <AppKeyValueRow
              label="Valor atual"
              value={formatCurrency(valuation.totalCurrentValue)}
            />
            <AppKeyValueRow
              label="Valor investido"
              value={formatCurrency(valuation.totalInvestedAmount)}
            />
            <AppKeyValueRow
              label="Retorno"
              value={`${valuation.totalProfitLossPercent.toFixed(2)}%`}
            />
            <AppKeyValueRow
              label="Ativos"
              value={valuation.totalInvestments.toString()}
            />
          </>
        )}
      </AppQueryState>
    </AppSurfaceCard>
  );
}
