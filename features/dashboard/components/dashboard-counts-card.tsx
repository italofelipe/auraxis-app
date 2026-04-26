import type { ReactElement } from "react";

import { Paragraph, XStack, YStack } from "tamagui";

import type { DashboardOverview } from "@/features/dashboard/contracts";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";

export interface DashboardCountsCardProps {
  readonly counts: DashboardOverview["counts"];
}

const STATUS_LABEL: Record<string, string> = {
  paid: "Pagas",
  pending: "Pendentes",
  overdue: "Em atraso",
  cancelled: "Canceladas",
  postponed: "Adiadas",
};

/**
 * Small breakdown card surfacing transaction counts of the current
 * dashboard period. Pure view bound to `DashboardOverview.counts`.
 */
export function DashboardCountsCard({
  counts,
}: DashboardCountsCardProps): ReactElement {
  const statusEntries = Object.entries(counts.status ?? {})
    .filter(([, value]) => value > 0)
    .sort((a, b) => b[1] - a[1]);

  return (
    <AppSurfaceCard
      title="Resumo de transacoes"
      description="Quantidades do periodo selecionado."
    >
      <YStack gap="$3">
        <XStack gap="$3" flexWrap="wrap">
          <CountStat label="Total" value={counts.totalTransactions} />
          <CountStat label="Receitas" value={counts.incomeTransactions} />
          <CountStat label="Despesas" value={counts.expenseTransactions} />
        </XStack>
        {statusEntries.length > 0 ? (
          <YStack gap="$1">
            <Paragraph color="$muted" fontFamily="$body" fontSize="$2">
              Por status
            </Paragraph>
            <XStack gap="$3" flexWrap="wrap">
              {statusEntries.map(([status, count]) => (
                <CountStat
                  key={status}
                  label={STATUS_LABEL[status] ?? status}
                  value={count}
                  size="small"
                />
              ))}
            </XStack>
          </YStack>
        ) : null}
      </YStack>
    </AppSurfaceCard>
  );
}

interface CountStatProps {
  readonly label: string;
  readonly value: number;
  readonly size?: "default" | "small";
}

function CountStat({ label, value, size = "default" }: CountStatProps): ReactElement {
  const fontSize = size === "small" ? "$5" : "$6";
  return (
    <YStack gap="$1">
      <Paragraph color="$muted" fontFamily="$body" fontSize="$2">
        {label}
      </Paragraph>
      <Paragraph color="$color" fontFamily="$heading" fontSize={fontSize}>
        {value}
      </Paragraph>
    </YStack>
  );
}
