import type { ReactElement } from "react";

import { Paragraph, YStack } from "tamagui";

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
      <AppSurfaceCard title="Metas" description="Acompanhamento das suas metas financeiras.">
        <AppQueryState
          query={controller.goalsQuery}
          options={{
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
            isEmpty: (data) => data.goals.length === 0,
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
                        {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
                      </Paragraph>
                      <Paragraph color="$muted" fontFamily="$body" fontSize="$3">
                        {goal.progress}%
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
