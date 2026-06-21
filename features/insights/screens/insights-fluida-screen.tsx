import type { ReactElement } from "react";

import { YStack } from "tamagui";

import { InsightLead } from "@/features/insights/fluida/components/insight-lead";
import { InsightsMasthead } from "@/features/insights/fluida/components/insights-masthead";
import { useInsightsFluidaScreenController } from "@/features/insights/hooks/use-insights-fluida-screen-controller";
import { AppScreen } from "@/shared/components/app-screen";

/**
 * "Fluida" insights screen — editorial reading of the AI-generated
 * insights (etapa 1). Composes the masthead and the editorial lead. The
 * remaining beats (comparatives, chart, pull-stat, attention list,
 * "where to go next", AI provenance) land in the next stages.
 *
 * @returns The composed Fluida screen.
 */
export function InsightsFluidaScreen(): ReactElement {
  const controller = useInsightsFluidaScreenController();

  return (
    <AppScreen testID="insights-fluida-screen">
      <YStack gap="$5">
        <InsightsMasthead
          cadence={controller.cadence}
          dimension={controller.dimension}
          cadenceOptions={controller.cadenceOptions}
          dimensionTabs={controller.dimensionTabs}
          isDark={controller.isDark}
          onSelectCadence={controller.selectCadence}
          onSelectDimension={controller.selectDimension}
          onToggleTheme={controller.toggleTheme}
        />

        <InsightLead lead={controller.lead} />

        {/* TODO(etapa 2): CompareCards — "Como se compara" (ontem · anteontem · vs. semana). */}
        {/* TODO(etapa 2): TextBeat capitular + ChartBeat "O ritmo de saídas" (7 dias / 6 semanas). */}
        {/* TODO(etapa 3): PullStat (destaque numérico) + AlertList (pontos de atenção). */}
        {/* TODO(etapa 3): Seguir ("Para onde seguir agora") + AiMeta (procedência da IA). */}
      </YStack>
    </AppScreen>
  );
}
