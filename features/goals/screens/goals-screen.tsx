import type { ReactElement } from "react";

import { Paragraph, XStack, YStack } from "tamagui";

import { useGoalsScreenController } from "@/features/goals/hooks/use-goals-screen-controller";
import { AppKeyValueRow } from "@/shared/components/app-key-value-row";
import { AppQueryState } from "@/shared/components/app-query-state";
import { AppScreen } from "@/shared/components/app-screen";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";
import { formatCurrency } from "@/shared/utils/formatters";

/**
 * Canonical goals screen composition for the mobile app.
 *
 * @returns Goal list with progress, loading, empty and error states.
 */
export function GoalsScreen(): ReactElement {
  const controller = useGoalsScreenController();

  return (
    <AppScreen>
      <AppSurfaceCard
        title="Suas metas"
        description="Acompanhe o progresso das suas metas financeiras."
      >
        <XStack gap="$3" flexWrap="wrap">
          <YStack gap="$1">
            <Paragraph color="$muted" fontFamily="$body" fontSize="$2">
              Total
            </Paragraph>
            <Paragraph color="$color" fontFamily="$heading" fontSize="$6">
              {controller.summary.total}
            </Paragraph>
          </YStack>
          <YStack gap="$1">
            <Paragraph color="$muted" fontFamily="$body" fontSize="$2">
              Ativas
            </Paragraph>
            <Paragraph color="$color" fontFamily="$heading" fontSize="$6">
              {controller.summary.active}
            </Paragraph>
          </YStack>
          <YStack gap="$1">
            <Paragraph color="$muted" fontFamily="$body" fontSize="$2">
              Concluidas
            </Paragraph>
            <Paragraph color="$color" fontFamily="$heading" fontSize="$6">
              {controller.summary.completed}
            </Paragraph>
          </YStack>
        </XStack>
      </AppSurfaceCard>

      <AppSurfaceCard
        title="Lista"
        description="Metas em andamento aparecem primeiro."
      >
        <AppQueryState
          query={controller.goalsQuery}
          options={{
            loading: {
              title: "Carregando metas",
              description: "Buscando suas metas financeiras.",
            },
            empty: {
              title: "Nenhuma meta encontrada",
              description:
                "Crie sua primeira meta para comecar a acompanhar seu progresso.",
            },
            error: {
              fallbackTitle: "Nao foi possivel carregar as metas",
              fallbackDescription: "Tente novamente em instantes.",
            },
            isEmpty: () => controller.goals.length === 0,
          }}
        >
          {() => (
            <YStack gap="$3">
              {controller.goals.map((goal) => (
                <AppKeyValueRow
                  key={goal.id}
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
                        {goal.progress}%
                        {goal.isCompleted ? " · concluida" : ""}
                      </Paragraph>
                    </YStack>
                  }
                />
              ))}
            </YStack>
          )}
        </AppQueryState>
      </AppSurfaceCard>
    </AppScreen>
  );
}
