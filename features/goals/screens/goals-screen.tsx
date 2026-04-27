import { useCallback, useMemo, type ReactElement } from "react";

import { FlashList } from "@shopify/flash-list";
import { RefreshControl } from "react-native";
import { Paragraph, XStack, YStack } from "tamagui";

import { queryKeys } from "@/core/query/query-keys";
import { GoalForm } from "@/features/goals/components/goal-form";
import { GoalPlanCard } from "@/features/goals/components/goal-plan-card";
import { GoalProjectionCard } from "@/features/goals/components/goal-projection-card";
import {
  useGoalsScreenController,
  type GoalsScreenController,
} from "@/features/goals/hooks/use-goals-screen-controller";
import type { GoalProgressView } from "@/features/goals/services/goal-progress-calculator";
import { AppButton } from "@/shared/components/app-button";
import { AppEmptyState } from "@/shared/components/app-empty-state";
import { AppKeyValueRow } from "@/shared/components/app-key-value-row";
import { AppQueryState } from "@/shared/components/app-query-state";
import { AppScreen } from "@/shared/components/app-screen";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";
import { useListRefresh } from "@/shared/hooks/use-list-refresh";
import { GoalListSkeleton } from "@/shared/skeletons";
import { formatCurrency } from "@/shared/utils/formatters";

interface GoalsListData {
  readonly goals: readonly { readonly id: string }[];
}

const GOALS_REFRESH_KEYS = [queryKeys.goals.list()] as const;

const STATIC_GOALS_OPTIONS = {
  loading: {
    title: "Carregando metas",
    description: "Buscando suas metas financeiras.",
  },
  empty: {
    title: "Nenhuma meta encontrada",
    description: "Crie sua primeira meta para comecar a acompanhar seu progresso.",
  },
  error: {
    fallbackTitle: "Nao foi possivel carregar as metas",
    fallbackDescription: "Tente novamente em instantes.",
  },
} as const;

const extractGoalKey = (goal: GoalProgressView): string => goal.id;
const listContainerStyle = { paddingBottom: 24 } as const;

function ListSeparator(): ReactElement {
  return <YStack height="$3" />;
}

/**
 * Canonical goals screen composition for the mobile app.
 *
 * @returns Goal list with create/edit/delete actions or active form panel.
 */
export function GoalsScreen(): ReactElement {
  const controller = useGoalsScreenController();

  if (controller.formMode.kind !== "closed") {
    return (
      <AppScreen>
        <GoalForm
          initialGoal={
            controller.formMode.kind === "edit" ? controller.formMode.goal : null
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
    <AppScreen scrollable={false}>
      <SummaryCard controller={controller} />
      <YStack flex={1}>
        <GoalsListCard controller={controller} />
      </YStack>
    </AppScreen>
  );
}

interface ControllerProps {
  readonly controller: GoalsScreenController;
}

function SummaryCard({ controller }: ControllerProps): ReactElement {
  return (
    <AppSurfaceCard
      title="Suas metas"
      description="Acompanhe o progresso das suas metas financeiras."
    >
      <YStack gap="$3">
        <XStack gap="$3" flexWrap="wrap">
          <SummaryStat label="Total" value={controller.summary.total} />
          <SummaryStat label="Ativas" value={controller.summary.active} />
          <SummaryStat label="Concluidas" value={controller.summary.completed} />
        </XStack>
        <AppButton onPress={controller.handleOpenCreate}>Nova meta</AppButton>
      </YStack>
    </AppSurfaceCard>
  );
}

function SummaryStat({
  label,
  value,
}: {
  readonly label: string;
  readonly value: number;
}): ReactElement {
  return (
    <YStack gap="$1">
      <Paragraph color="$muted" fontFamily="$body" fontSize="$2">
        {label}
      </Paragraph>
      <Paragraph color="$color" fontFamily="$heading" fontSize="$6">
        {value}
      </Paragraph>
    </YStack>
  );
}

function GoalsListCard({ controller }: ControllerProps): ReactElement {
  const queryStateOptions = useMemo(
    () => ({
      ...STATIC_GOALS_OPTIONS,
      isEmpty: (data: GoalsListData) =>
        data.goals.length === 0 || controller.goals.length === 0,
    }),
    [controller.goals.length],
  );

  const emptyComponent = useMemo(
    () => (
      <AppEmptyState
        illustration="goals"
        title="Sem metas por aqui"
        description="Defina sua primeira meta financeira para comecar a acompanhar seu progresso."
        cta={{ label: "Nova meta", onPress: controller.handleOpenCreate }}
      />
    ),
    [controller.handleOpenCreate],
  );

  return (
    <AppQueryState
      query={controller.goalsQuery}
      options={queryStateOptions}
      loadingComponent={<GoalListSkeleton rows={3} />}
      emptyComponent={emptyComponent}
    >
      {() => <GoalsList controller={controller} />}
    </AppQueryState>
  );
}

function GoalsList({ controller }: ControllerProps): ReactElement {
  const { refreshing, onRefresh } = useListRefresh(GOALS_REFRESH_KEYS);

  const handleEdit = useCallback(
    (goal: GoalProgressView): void => {
      controller.handleOpenEdit(goal);
    },
    [controller],
  );

  const handleDelete = useCallback(
    (goalId: string): void => {
      void controller.handleDelete(goalId);
    },
    [controller],
  );

  const handleTogglePlan = useCallback(
    (goalId: string): void => {
      controller.handleTogglePlan(goalId);
    },
    [controller],
  );

  const renderItem = useCallback(
    ({ item }: { readonly item: GoalProgressView }) => (
      <GoalItem
        goal={item}
        isPlanOpen={controller.selectedPlanGoalId === item.id}
        isDeleting={controller.deletingGoalId === item.id}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onTogglePlan={handleTogglePlan}
      />
    ),
    [
      controller.deletingGoalId,
      controller.selectedPlanGoalId,
      handleDelete,
      handleEdit,
      handleTogglePlan,
    ],
  );

  return (
    <FlashList
      data={controller.goals}
      keyExtractor={extractGoalKey}
      renderItem={renderItem}
      contentContainerStyle={listContainerStyle}
      ItemSeparatorComponent={ListSeparator}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      testID="goals-flashlist"
    />
  );
}

interface GoalItemProps {
  readonly goal: GoalProgressView;
  readonly isPlanOpen: boolean;
  readonly isDeleting: boolean;
  readonly onEdit: (goal: GoalProgressView) => void;
  readonly onDelete: (goalId: string) => void;
  readonly onTogglePlan: (goalId: string) => void;
}

const GoalItem = function GoalItem({
  goal,
  isPlanOpen,
  isDeleting,
  onEdit,
  onDelete,
  onTogglePlan,
}: GoalItemProps): ReactElement {
  const handleEdit = useCallback(() => onEdit(goal), [goal, onEdit]);
  const handleDelete = useCallback(() => onDelete(goal.id), [goal.id, onDelete]);
  const handleToggle = useCallback(
    () => onTogglePlan(goal.id),
    [goal.id, onTogglePlan],
  );

  return (
    <YStack gap="$3">
      <YStack gap="$2">
        <AppKeyValueRow
          label={goal.title}
          value={
            <YStack alignItems="flex-end" gap="$1">
              <Paragraph color="$color" fontFamily="$body" fontSize="$4">
                {formatCurrency(goal.currentAmount)} /{" "}
                {formatCurrency(goal.targetAmount)}
              </Paragraph>
              <Paragraph
                color={goal.isCompleted ? "$success" : "$muted"}
                fontFamily="$body"
                fontSize="$3"
              >
                {goal.progress}%{goal.isCompleted ? " · concluida" : ""}
              </Paragraph>
            </YStack>
          }
        />
        <XStack gap="$2" flexWrap="wrap">
          <AppButton tone="secondary" onPress={handleToggle} disabled={isDeleting}>
            {isPlanOpen ? "Ocultar plano" : "Ver plano"}
          </AppButton>
          <AppButton tone="secondary" onPress={handleEdit} disabled={isDeleting}>
            Editar
          </AppButton>
          <AppButton tone="secondary" onPress={handleDelete} disabled={isDeleting}>
            {isDeleting ? "Excluindo..." : "Excluir"}
          </AppButton>
        </XStack>
      </YStack>
      {isPlanOpen ? (
        <YStack gap="$3">
          <GoalPlanCard goalId={goal.id} />
          <GoalProjectionCard goalId={goal.id} />
        </YStack>
      ) : null}
    </YStack>
  );
};
