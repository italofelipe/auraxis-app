import { useMemo, type ReactElement } from "react";

import { Paragraph, XStack, YStack } from "tamagui";

import { GoalForm } from "@/features/goals/components/goal-form";
import { GoalPlanCard } from "@/features/goals/components/goal-plan-card";
import { GoalProjectionCard } from "@/features/goals/components/goal-projection-card";
import {
  useGoalsScreenController,
  type GoalsScreenController,
} from "@/features/goals/hooks/use-goals-screen-controller";
import type { GoalProgressView } from "@/features/goals/services/goal-progress-calculator";
import { AppButton } from "@/shared/components/app-button";
import { AppKeyValueRow } from "@/shared/components/app-key-value-row";
import { AppQueryState } from "@/shared/components/app-query-state";
import { AppScreen } from "@/shared/components/app-screen";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";
import { formatCurrency } from "@/shared/utils/formatters";

interface GoalsListData {
  readonly goals: readonly { readonly id: string }[];
}

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
    <AppScreen>
      <SummaryCard controller={controller} />
      <GoalsListCard controller={controller} />
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

  return (
    <AppSurfaceCard
      title="Lista"
      description="Metas em andamento aparecem primeiro."
    >
      <AppQueryState query={controller.goalsQuery} options={queryStateOptions}>
        {() => (
          <YStack gap="$3">
            {controller.goals.map((goal) => (
              <YStack key={goal.id} gap="$3">
                <GoalRow
                  goal={goal}
                  isPlanOpen={controller.selectedPlanGoalId === goal.id}
                  isDeleting={controller.deletingGoalId === goal.id}
                  onEdit={() => controller.handleOpenEdit(goal)}
                  onDelete={() => {
                    void controller.handleDelete(goal.id);
                  }}
                  onTogglePlan={() => controller.handleTogglePlan(goal.id)}
                />
                {controller.selectedPlanGoalId === goal.id ? (
                  <YStack gap="$3">
                    <GoalPlanCard goalId={goal.id} />
                    <GoalProjectionCard goalId={goal.id} />
                  </YStack>
                ) : null}
              </YStack>
            ))}
          </YStack>
        )}
      </AppQueryState>
    </AppSurfaceCard>
  );
}

interface GoalRowProps {
  readonly goal: GoalProgressView;
  readonly isPlanOpen: boolean;
  readonly isDeleting: boolean;
  readonly onEdit: () => void;
  readonly onDelete: () => void;
  readonly onTogglePlan: () => void;
}

function GoalRow({
  goal,
  isPlanOpen,
  isDeleting,
  onEdit,
  onDelete,
  onTogglePlan,
}: GoalRowProps): ReactElement {
  return (
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
        <AppButton tone="secondary" onPress={onTogglePlan} disabled={isDeleting}>
          {isPlanOpen ? "Ocultar plano" : "Ver plano"}
        </AppButton>
        <AppButton tone="secondary" onPress={onEdit} disabled={isDeleting}>
          Editar
        </AppButton>
        <AppButton tone="secondary" onPress={onDelete} disabled={isDeleting}>
          {isDeleting ? "Excluindo..." : "Excluir"}
        </AppButton>
      </XStack>
    </YStack>
  );
}
