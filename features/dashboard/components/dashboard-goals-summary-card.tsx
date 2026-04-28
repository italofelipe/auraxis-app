import { useCallback, useMemo, type ReactElement } from "react";

import { useRouter } from "expo-router";
import { Paragraph, XStack, YStack } from "tamagui";

import { appRoutes } from "@/core/navigation/routes";
import type { GoalRecord } from "@/features/goals/contracts";
import { useGoalsQuery } from "@/features/goals/hooks/use-goals-query";
import { AppButton } from "@/shared/components/app-button";
import { AppQueryState } from "@/shared/components/app-query-state";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";
import { GoalListSkeleton } from "@/shared/skeletons";
import { useT } from "@/shared/i18n";
import { formatCurrency } from "@/shared/utils/formatters";

const TOP_GOALS_LIMIT = 2;

const computeProgress = (goal: GoalRecord): number => {
  if (goal.targetAmount <= 0) {
    return 0;
  }
  return Math.min(
    100,
    Math.round((goal.currentAmount / goal.targetAmount) * 100),
  );
};

const sortByProgressDesc = (a: GoalRecord, b: GoalRecord): number => {
  return computeProgress(b) - computeProgress(a);
};

/**
 * Embedded goals summary on the dashboard. Shows the top progressing
 * goals so the user can see momentum without navigating to /metas.
 */
export function DashboardGoalsSummaryCard(): ReactElement {
  const { t } = useT();
  const router = useRouter();
  const query = useGoalsQuery();

  const handleViewAll = useCallback((): void => {
    router.push(appRoutes.private.goals);
  }, [router]);

  return (
    <AppSurfaceCard
      title={t("dashboard.embeddedSummaries.goals.title")}
    >
      <YStack gap="$3">
        <AppQueryState
          query={query}
          options={{
            loading: {
              title: t("dashboard.embeddedSummaries.goals.title"),
            },
            loadingPresentation: "skeleton",
            empty: {
              title: t("dashboard.embeddedSummaries.goals.empty"),
            },
            error: {
              fallbackTitle: t("dashboard.embeddedSummaries.goals.title"),
            },
            isEmpty: (data) => data.goals.length === 0,
          }}
          loadingComponent={<GoalListSkeleton rows={2} />}
        >
          {(data) => <TopGoals goals={data.goals} />}
        </AppQueryState>
        <AppButton tone="secondary" onPress={handleViewAll}>
          {t("dashboard.embeddedSummaries.goals.viewAll")}
        </AppButton>
      </YStack>
    </AppSurfaceCard>
  );
}

interface TopGoalsProps {
  readonly goals: readonly GoalRecord[];
}

function TopGoals({ goals }: TopGoalsProps): ReactElement {
  const ranked = useMemo(
    () => [...goals].sort(sortByProgressDesc).slice(0, TOP_GOALS_LIMIT),
    [goals],
  );

  return (
    <YStack gap="$3">
      {ranked.map((goal) => (
        <GoalRow key={goal.id} goal={goal} />
      ))}
    </YStack>
  );
}

interface GoalRowProps {
  readonly goal: GoalRecord;
}

function GoalRow({ goal }: GoalRowProps): ReactElement {
  const progress = computeProgress(goal);
  return (
    <YStack gap="$2">
      <XStack alignItems="center" justifyContent="space-between" gap="$3">
        <Paragraph color="$color" fontFamily="$body" fontSize="$4">
          {goal.title}
        </Paragraph>
        <Paragraph color="$muted" fontFamily="$body" fontSize="$3">
          {progress}%
        </Paragraph>
      </XStack>
      <YStack
        height="$1"
        width="100%"
        backgroundColor="$surfaceRaised"
        borderRadius="$1"
        overflow="hidden"
      >
        <YStack
          height="$1"
          width={`${Math.max(2, progress)}%`}
          backgroundColor="$secondary"
          borderRadius="$1"
        />
      </YStack>
      <Paragraph color="$muted" fontFamily="$body" fontSize="$2">
        {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
      </Paragraph>
    </YStack>
  );
}
