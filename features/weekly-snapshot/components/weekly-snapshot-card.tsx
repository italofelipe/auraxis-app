import { useEffect, type ReactElement } from "react";

import { Paragraph, XStack, YStack } from "tamagui";

import type { WeeklySnapshot } from "@/features/weekly-snapshot/contracts";
import { useWeeklySnapshotCardController } from "@/features/weekly-snapshot/hooks/use-weekly-snapshot-card-controller";
import { AppBadge } from "@/shared/components/app-badge";
import { AppQueryState } from "@/shared/components/app-query-state";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";
import { formatCurrency } from "@/shared/utils/formatters";

const deltaTone = (
  delta: number,
  lowerIsBetter: boolean,
): "default" | "primary" | "danger" => {
  if (delta === 0) {
    return "default";
  }
  const isGood = lowerIsBetter ? delta < 0 : delta > 0;
  return isGood ? "primary" : "danger";
};

const expenseDeltaLabel = (delta: number): string => {
  if (delta === 0) {
    return "Despesas sem mudança";
  }
  return `Despesas ${formatCurrency(Math.abs(delta))} ${delta > 0 ? "a mais" : "a menos"}`;
};

const balanceDeltaLabel = (delta: number): string => {
  if (delta === 0) {
    return "Saldo sem mudança";
  }
  return `Saldo ${formatCurrency(Math.abs(delta))} ${delta > 0 ? "acima" : "abaixo"}`;
};

/**
 * Premium weekly-snapshot dashboard card (parity with web UX-02-1).
 *
 * Gated on the `advanced_simulations` entitlement — renders nothing for free
 * users (no premium teaser here). Shows the AI narrative, current-week totals,
 * week-over-week deltas and a "NOVO" badge driven by change detection; viewing
 * the card marks the snapshot as seen.
 */
export function WeeklySnapshotCard(): ReactElement | null {
  const controller = useWeeklySnapshotCardController();

  if (!controller.hasAccess) {
    return null;
  }

  return (
    <AppQueryState
      query={controller.query}
      options={{
        loading: { title: "Gerando seu resumo semanal" },
        loadingPresentation: "notice",
        empty: { title: "Resumo semanal indisponivel" },
        error: { fallbackTitle: "Nao foi possivel carregar o resumo semanal" },
      }}
    >
      {(snapshot) => (
        <WeeklySnapshotContent
          snapshot={snapshot}
          isNew={controller.isNew}
          onSeen={controller.markSeen}
        />
      )}
    </AppQueryState>
  );
}

interface WeeklySnapshotContentProps {
  readonly snapshot: WeeklySnapshot;
  readonly isNew: boolean;
  readonly onSeen: () => Promise<void>;
}

function WeeklySnapshotContent({
  snapshot,
  isNew,
  onSeen,
}: WeeklySnapshotContentProps): ReactElement {
  useEffect(() => {
    if (isNew) {
      void onSeen();
    }
  }, [isNew, onSeen]);

  return (
    <AppSurfaceCard
      title="Resumo semanal"
      description="Sua semana analisada pela IA."
    >
      <YStack gap="$3">
        {isNew ? (
          <XStack>
            <AppBadge tone="primary">NOVO</AppBadge>
          </XStack>
        ) : null}
        {snapshot.transactionCount === 0 ? (
          <Paragraph color="$muted" fontFamily="$body" fontSize="$4">
            Sem movimentações nesta semana
          </Paragraph>
        ) : (
          <>
            <Paragraph color="$color" fontFamily="$body" fontSize="$4">
              {snapshot.narrative}
            </Paragraph>
            <XStack gap="$3" flexWrap="wrap">
              <Metric label="Receitas" value={formatCurrency(snapshot.currentIncome)} />
              <Metric label="Despesas" value={formatCurrency(snapshot.currentExpense)} />
              <Metric label="Saldo" value={formatCurrency(snapshot.currentBalance)} />
            </XStack>
            <XStack gap="$2" flexWrap="wrap">
              <AppBadge tone={deltaTone(snapshot.expenseDelta, true)}>
                {expenseDeltaLabel(snapshot.expenseDelta)}
              </AppBadge>
              <AppBadge tone={deltaTone(snapshot.balanceDelta, false)}>
                {balanceDeltaLabel(snapshot.balanceDelta)}
              </AppBadge>
              <AppBadge tone="default">
                {`${snapshot.transactionCount} transações`}
              </AppBadge>
            </XStack>
          </>
        )}
      </YStack>
    </AppSurfaceCard>
  );
}

interface MetricProps {
  readonly label: string;
  readonly value: string;
}

function Metric({ label, value }: MetricProps): ReactElement {
  return (
    <YStack gap="$1">
      <Paragraph color="$muted" fontFamily="$body" fontSize="$2">
        {label}
      </Paragraph>
      <Paragraph color="$color" fontFamily="$heading" fontSize="$5">
        {value}
      </Paragraph>
    </YStack>
  );
}
