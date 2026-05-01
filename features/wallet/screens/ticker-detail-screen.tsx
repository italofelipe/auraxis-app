import type { ReactElement } from "react";

import { Paragraph, XStack, YStack } from "tamagui";

import type {
  BrapiCurrentQuote,
  BrapiDividendEntry,
  BrapiHistoricalSeries,
} from "@/features/wallet/brapi-contracts";
import { TickerPriceChart } from "@/features/wallet/components/ticker-price-chart";
import { TickerRangeSelector } from "@/features/wallet/components/ticker-range-selector";
import type { WalletOperationsPosition } from "@/features/wallet/contracts";
import {
  useTickerDetailScreenController,
  type TickerDetailScreenController,
} from "@/features/wallet/hooks/use-ticker-detail-screen-controller";
import { AppButton } from "@/shared/components/app-button";
import { AppErrorNotice } from "@/shared/components/app-error-notice";
import { AppKeyValueRow } from "@/shared/components/app-key-value-row";
import { AppScreen } from "@/shared/components/app-screen";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";
import { formatCurrency, formatShortDate } from "@/shared/utils/formatters";

const formatChangePercent = (value: number): string => {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
};

const trendTone = (value: number | null | undefined): string => {
  if (value === null || value === undefined || value === 0) {
    return "$muted";
  }
  return value > 0 ? "$success" : "$danger";
};

const trendIcon = (value: number | null | undefined): string => {
  if (value === null || value === undefined || value === 0) {
    return "•";
  }
  return value > 0 ? "▲" : "▼";
};

interface HeaderProps {
  readonly ticker: string;
  readonly entryName: string | null;
  readonly quote: BrapiCurrentQuote | null;
  readonly isLoading: boolean;
  readonly onBack: () => void;
}

function Header({
  ticker,
  entryName,
  quote,
  isLoading,
  onBack,
}: HeaderProps): ReactElement {
  const subtitle = entryName ?? quote?.shortName ?? "Detalhes do ativo";
  const change = quote?.changePercent ?? null;
  return (
    <XStack
      justifyContent="space-between"
      alignItems="center"
      gap="$3"
      flexWrap="wrap"
    >
      <YStack gap="$1" flex={1} minWidth={180}>
        <Paragraph color="$color" fontFamily="$heading" fontSize="$8">
          {ticker || "—"}
        </Paragraph>
        <Paragraph color="$muted" fontFamily="$body" fontSize="$3">
          {subtitle}
        </Paragraph>
        {quote !== null ? (
          <XStack gap="$2" alignItems="center" flexWrap="wrap">
            <Paragraph color="$color" fontFamily="$heading" fontSize="$6">
              {formatCurrency(quote.price)}
            </Paragraph>
            <Paragraph
              color={trendTone(change)}
              fontFamily="$body"
              fontSize="$4"
            >
              {trendIcon(change)} {formatChangePercent(change ?? 0)}
            </Paragraph>
          </XStack>
        ) : isLoading ? (
          <Paragraph color="$muted" fontFamily="$body" fontSize="$3">
            Carregando cotacao…
          </Paragraph>
        ) : (
          <Paragraph color="$muted" fontFamily="$body" fontSize="$3">
            Cotacao indisponivel.
          </Paragraph>
        )}
      </YStack>
      <AppButton tone="secondary" onPress={onBack}>
        Voltar
      </AppButton>
    </XStack>
  );
}

interface ChartCardProps {
  readonly series: BrapiHistoricalSeries | null;
  readonly isLoading: boolean;
  readonly controller: TickerDetailScreenController;
}

function ChartCard({
  series,
  isLoading,
  controller,
}: ChartCardProps): ReactElement {
  return (
    <AppSurfaceCard
      title="Historico de cotacao"
      description="Variacao de preco para o periodo selecionado."
    >
      <YStack gap="$3">
        <TickerRangeSelector
          selectedRange={controller.selectedRange}
          onSelect={controller.handleSelectRange}
          disabled={isLoading}
        />
        {isLoading ? (
          <Paragraph color="$muted" fontFamily="$body" fontSize="$3">
            Carregando serie historica…
          </Paragraph>
        ) : controller.historicalError !== null ? (
          <AppErrorNotice
            error={controller.historicalError}
            fallbackTitle="Nao foi possivel carregar a serie"
            fallbackDescription="Tente outro periodo ou volte mais tarde."
          />
        ) : (
          <TickerPriceChart points={series?.points ?? []} />
        )}
      </YStack>
    </AppSurfaceCard>
  );
}

interface PositionMetrics {
  readonly currentValue: number | null;
  readonly profitAbsolute: number | null;
  readonly profitPercent: number | null;
}

const computePositionMetrics = (
  position: WalletOperationsPosition,
  currentQuote: BrapiCurrentQuote | null,
): PositionMetrics => {
  const currentValue =
    currentQuote !== null
      ? currentQuote.price * position.currentQuantity
      : null;
  const profitAbsolute =
    currentValue === null ? null : currentValue - position.investedAmount;
  const profitPercent =
    currentValue === null || position.investedAmount === 0
      ? null
      : ((currentValue - position.investedAmount) / position.investedAmount) *
        100;
  return { currentValue, profitAbsolute, profitPercent };
};

interface ProfitRowProps {
  readonly profitAbsolute: number;
  readonly profitPercent: number | null;
}

function ProfitRow({
  profitAbsolute,
  profitPercent,
}: ProfitRowProps): ReactElement {
  return (
    <AppKeyValueRow
      label="Lucro / prejuizo"
      value={
        <YStack alignItems="flex-end" gap="$1">
          <Paragraph
            color={trendTone(profitAbsolute)}
            fontFamily="$body"
            fontSize="$4"
          >
            {profitAbsolute >= 0 ? "+" : ""}
            {formatCurrency(profitAbsolute)}
          </Paragraph>
          {profitPercent !== null ? (
            <Paragraph
              color={trendTone(profitPercent)}
              fontFamily="$body"
              fontSize="$3"
            >
              {formatChangePercent(profitPercent)}
            </Paragraph>
          ) : null}
        </YStack>
      }
    />
  );
}

interface PositionRowsProps {
  readonly position: WalletOperationsPosition;
  readonly metrics: PositionMetrics;
}

function PositionRows({
  position,
  metrics,
}: PositionRowsProps): ReactElement {
  return (
    <YStack gap="$2">
      <AppKeyValueRow
        label="Quantidade"
        value={position.currentQuantity.toString()}
      />
      <AppKeyValueRow
        label="Preco medio"
        value={formatCurrency(position.averagePrice)}
      />
      <AppKeyValueRow
        label="Investido"
        value={formatCurrency(position.investedAmount)}
      />
      {metrics.currentValue !== null ? (
        <AppKeyValueRow
          label="Valor atual"
          value={formatCurrency(metrics.currentValue)}
        />
      ) : null}
      {metrics.profitAbsolute !== null ? (
        <ProfitRow
          profitAbsolute={metrics.profitAbsolute}
          profitPercent={metrics.profitPercent}
        />
      ) : null}
      <AppKeyValueRow
        label="Lucro realizado"
        value={formatCurrency(position.realizedProfit)}
      />
    </YStack>
  );
}

interface PositionCardProps {
  readonly entryName: string | null;
  readonly position: WalletOperationsPosition | null;
  readonly currentQuote: BrapiCurrentQuote | null;
  readonly isLoading: boolean;
  readonly onOpenBuy: () => void;
  readonly onOpenSell: () => void;
}

function PositionCard({
  entryName,
  position,
  currentQuote,
  isLoading,
  onOpenBuy,
  onOpenSell,
}: PositionCardProps): ReactElement {
  if (isLoading) {
    return (
      <AppSurfaceCard
        title="Sua posicao"
        description="Quantidade, preco medio e P&L deste ativo."
      >
        <Paragraph color="$muted" fontFamily="$body" fontSize="$3">
          Calculando posicao consolidada…
        </Paragraph>
      </AppSurfaceCard>
    );
  }
  if (position === null) {
    return (
      <AppSurfaceCard
        title="Sua posicao"
        description="Adicione este ticker a carteira para ver sua posicao."
      >
        <Paragraph color="$muted" fontFamily="$body" fontSize="$3">
          {entryName === null
            ? "Este ticker ainda nao esta na sua carteira."
            : "Sem operacoes registradas para este ativo."}
        </Paragraph>
      </AppSurfaceCard>
    );
  }
  const metrics = computePositionMetrics(position, currentQuote);
  return (
    <AppSurfaceCard
      title="Sua posicao"
      description="Resumo consolidado das operacoes do ativo."
    >
      <PositionRows position={position} metrics={metrics} />
      <XStack gap="$2" flexWrap="wrap">
        <AppButton onPress={onOpenBuy}>Comprar</AppButton>
        <AppButton tone="secondary" onPress={onOpenSell}>
          Vender
        </AppButton>
      </XStack>
    </AppSurfaceCard>
  );
}

interface FiiDividendCardProps {
  readonly lastDividend: BrapiDividendEntry | null;
  readonly isLoading: boolean;
}

function FiiDividendCard({
  lastDividend,
  isLoading,
}: FiiDividendCardProps): ReactElement {
  return (
    <AppSurfaceCard
      title="Ultimo provento"
      description="Distribuicao mais recente reportada pelo emissor."
    >
      {isLoading ? (
        <Paragraph color="$muted" fontFamily="$body" fontSize="$3">
          Buscando proventos do FII…
        </Paragraph>
      ) : lastDividend === null ? (
        <Paragraph color="$muted" fontFamily="$body" fontSize="$3">
          Sem provento publicado para este FII.
        </Paragraph>
      ) : (
        <YStack gap="$2">
          <AppKeyValueRow
            label="Tipo"
            value={lastDividend.type || "Rendimento"}
          />
          <AppKeyValueRow
            label="Valor por cota"
            value={formatCurrency(lastDividend.adjustedValue)}
          />
          <AppKeyValueRow
            label="Pagamento"
            value={formatShortDate(lastDividend.paymentDate)}
          />
        </YStack>
      )}
    </AppSurfaceCard>
  );
}

/**
 * Ticker detail screen showing live quote, historical chart, position
 * and (for FIIs) the most recent dividend distribution.
 */
export function TickerDetailScreen(): ReactElement {
  const controller = useTickerDetailScreenController();
  return (
    <AppScreen testID="ticker-detail-screen">
      <Header
        ticker={controller.ticker}
        entryName={controller.entry?.name ?? null}
        quote={controller.currentQuote}
        isLoading={controller.isCurrentQuoteLoading}
        onBack={controller.handleBack}
      />
      {controller.currentQuoteError !== null ? (
        <AppErrorNotice
          error={controller.currentQuoteError}
          fallbackTitle="Nao foi possivel carregar a cotacao"
          fallbackDescription="Confira a conexao e tente novamente."
        />
      ) : null}
      <ChartCard
        series={controller.historicalSeries}
        isLoading={controller.isHistoricalLoading}
        controller={controller}
      />
      <PositionCard
        entryName={controller.entry?.name ?? null}
        position={controller.position}
        currentQuote={controller.currentQuote}
        isLoading={controller.isPositionLoading}
        onOpenBuy={controller.handleOpenBuy}
        onOpenSell={controller.handleOpenSell}
      />
      {controller.isFii ? (
        <FiiDividendCard
          lastDividend={controller.fiiQuote?.lastDividend ?? null}
          isLoading={controller.isFiiLoading}
        />
      ) : null}
    </AppScreen>
  );
}
