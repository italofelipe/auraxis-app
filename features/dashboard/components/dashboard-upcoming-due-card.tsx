import { useMemo, type ReactElement } from "react";

import { Paragraph, XStack, YStack } from "tamagui";

import type { DueTransactionRecord } from "@/features/transactions/contracts";
import { useDueRangeQuery } from "@/features/transactions/hooks/use-due-range-query";
import { AppBadge } from "@/shared/components/app-badge";
import { AppKeyValueRow } from "@/shared/components/app-key-value-row";
import { AppQueryState } from "@/shared/components/app-query-state";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";
import { useT } from "@/shared/i18n";
import { TransactionListSkeleton } from "@/shared/skeletons";
import { formatShortDate } from "@/shared/utils/formatters";

const STATUS_TONE: Record<
  DueTransactionRecord["status"],
  "default" | "primary" | "danger"
> = {
  pending: "default",
  paid: "primary",
  overdue: "danger",
  cancelled: "default",
  postponed: "default",
};

const buildWindow = (): { start: string; end: string } => {
  const now = new Date();
  const sevenDaysOut = new Date(now);
  sevenDaysOut.setDate(sevenDaysOut.getDate() + 7);
  return {
    start: now.toISOString().slice(0, 10),
    end: sevenDaysOut.toISOString().slice(0, 10),
  };
};

/**
 * Dashboard card listing the top pending transactions in the next 7
 * days (overdue first). Uses the standard query feedback wrapper so
 * loading + empty + error all share the same canonical surface.
 */
export function DashboardUpcomingDueCard(): ReactElement {
  const { t } = useT();
  const window = useMemo(() => buildWindow(), []);
  const query = useDueRangeQuery({
    startDate: window.start,
    endDate: window.end,
    orderBy: "overdue_first",
    perPage: 5,
  });

  return (
    <AppSurfaceCard
      title={t("dashboard.upcomingDue.title")}
      description={t("dashboard.upcomingDue.description")}
    >
      <AppQueryState
        query={query}
        options={{
          loading: {
            title: t("dashboard.upcomingDue.title"),
            description: t("dashboard.upcomingDue.description"),
          },
          loadingPresentation: "skeleton",
          empty: {
            title: t("dashboard.upcomingDue.empty"),
          },
          error: {
            fallbackTitle: t("dashboard.upcomingDue.title"),
          },
          isEmpty: (data) => data.transactions.length === 0,
        }}
        loadingComponent={<TransactionListSkeleton rows={3} />}
      >
        {(data) => <DueList items={data.transactions} />}
      </AppQueryState>
    </AppSurfaceCard>
  );
}

interface DueListProps {
  readonly items: readonly DueTransactionRecord[];
}

function DueList({ items }: DueListProps): ReactElement {
  return (
    <YStack gap="$3">
      {items.map((item) => (
        <DueRow key={item.id} item={item} />
      ))}
    </YStack>
  );
}

interface DueRowProps {
  readonly item: DueTransactionRecord;
}

function DueRow({ item }: DueRowProps): ReactElement {
  return (
    <AppKeyValueRow
      label={item.title}
      value={
        <XStack alignItems="center" gap="$2">
          <YStack alignItems="flex-end" gap="$1">
            <Paragraph
              color={item.type === "income" ? "$success" : "$danger"}
              fontFamily="$body"
              fontSize="$4"
            >
              {item.type === "income" ? "+" : "-"}
              {item.amount}
            </Paragraph>
            <Paragraph color="$muted" fontFamily="$body" fontSize="$3">
              {formatShortDate(item.dueDate)}
            </Paragraph>
          </YStack>
          <AppBadge tone={STATUS_TONE[item.status]}>{item.status}</AppBadge>
        </XStack>
      }
    />
  );
}
