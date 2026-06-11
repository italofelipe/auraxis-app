import { type ReactElement } from "react";

import { useRouter } from "expo-router";
import { Paragraph, XStack, YStack } from "tamagui";

import { appRoutes } from "@/core/navigation/routes";
import { GoalPlanCard } from "@/features/goals/components/goal-plan-card";
import { GoalProjectionCard } from "@/features/goals/components/goal-projection-card";
import {
  useGoalDetailScreenController,
  type GoalDetailScreenController,
} from "@/features/goals/hooks/use-goal-detail-screen-controller";
import { AiInsightSurface } from "@/features/insights/components/ai-insight-surface";
import type { GoalProgressView } from "@/features/goals/services/goal-progress-calculator";
import { AppButton } from "@/shared/components/app-button";
import { AppEmptyState } from "@/shared/components/app-empty-state";
import { AppKeyValueRow } from "@/shared/components/app-key-value-row";
import { AppScreen } from "@/shared/components/app-screen";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";
import { GoalListSkeleton } from "@/shared/skeletons";
import { formatCurrency } from "@/shared/utils/formatters";

/**
 * Goal detail screen — parity with the web `goals/[id]` page: progress hero,
 * key metrics, canonical plan and projection cards, an AI insight surface for
 * the goals dimension, plus navigation to the scenario simulator.
 */
export function GoalDetailScreen(): ReactElement {
  const controller = useGoalDetailScreenController();

  if (controller.goalsQuery.isLoading && controller.goal === null) {
    return (
      <AppScreen>
        <GoalListSkeleton rows={3} />
      </AppScreen>
    );
  }

  if (controller.notFound || controller.goal === null) {
    return (
      <AppScreen>
        <AppEmptyState
          illustration="goals"
          title="Meta nao encontrada"
          description="Essa meta nao existe ou nao esta disponivel para sua conta."
          cta={{ label: "Voltar para metas", onPress: controller.handleBack }}
        />
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <GoalDetailContent controller={controller} goal={controller.goal} />
    </AppScreen>
  );
}

interface GoalDetailContentProps {
  readonly controller: GoalDetailScreenController;
  readonly goal: GoalProgressView;
}

function GoalDetailContent({
  controller,
  goal,
}: GoalDetailContentProps): ReactElement {
  const router = useRouter();

  return (
    <YStack gap="$3">
      <AppButton tone="secondary" onPress={controller.handleBack}>
        Voltar para metas
      </AppButton>

      <GoalDetailHero goal={goal} />

      <AppSurfaceCard title="Resumo" description="Objetivo, acumulado e prazo.">
        <YStack gap="$3">
          <AppKeyValueRow label="Objetivo" value={formatCurrency(goal.targetAmount)} />
          <AppKeyValueRow label="Acumulado" value={formatCurrency(goal.currentAmount)} />
          <AppKeyValueRow label="Faltam" value={formatCurrency(goal.remaining)} />
          <AppKeyValueRow label="Prazo" value={controller.targetDateLabel} />
        </YStack>
      </AppSurfaceCard>

      <AiInsightSurface
        dimension="goals"
        onOpenHub={() => router.push(appRoutes.private.insights)}
      />

      <GoalPlanCard goalId={goal.id} />
      <GoalProjectionCard goalId={goal.id} />

      <AppButton onPress={controller.handleSimulate}>Simular cenarios</AppButton>
    </YStack>
  );
}

interface GoalDetailHeroProps {
  readonly goal: GoalProgressView;
}

function GoalDetailHero({ goal }: GoalDetailHeroProps): ReactElement {
  return (
    <AppSurfaceCard title={goal.title} description="Meta financeira">
      <XStack alignItems="center" justifyContent="space-between" gap="$3">
        <YStack gap="$1" flex={1}>
          <Paragraph color="$muted" fontFamily="$body" fontSize="$2">
            Progresso
          </Paragraph>
          <ProgressTrack progress={goal.progress} />
        </YStack>
        <YStack alignItems="flex-end" gap="$1">
          <Paragraph
            color={goal.isCompleted ? "$success" : "$color"}
            fontFamily="$heading"
            fontSize="$8"
          >
            {goal.progress}%
          </Paragraph>
          <Paragraph color="$muted" fontFamily="$body" fontSize="$2">
            {goal.isCompleted ? "concluida" : "concluido"}
          </Paragraph>
        </YStack>
      </XStack>
    </AppSurfaceCard>
  );
}

interface ProgressTrackProps {
  readonly progress: number;
}

function ProgressTrack({ progress }: ProgressTrackProps): ReactElement {
  const width = Math.min(100, Math.max(0, progress));
  return (
    <YStack
      height={10}
      borderRadius="$10"
      backgroundColor="$backgroundPress"
      overflow="hidden"
      accessibilityRole="progressbar"
      accessibilityValue={{ now: width, min: 0, max: 100 }}
    >
      <YStack height="100%" width={`${width}%`} backgroundColor="$primary" />
    </YStack>
  );
}
