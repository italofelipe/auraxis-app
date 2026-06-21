import type { ReactElement } from "react";

import { YStack } from "tamagui";

import { borderWidths } from "@/config/design-tokens";
import type { InsightDimension } from "@/features/insights/contracts";
import { ChartBeat } from "@/features/insights/fluida/components/chart-beat";
import { CompareBeat } from "@/features/insights/fluida/components/compare-beat";
import { InsightLead } from "@/features/insights/fluida/components/insight-lead";
import { InsightsMasthead } from "@/features/insights/fluida/components/insights-masthead";
import { PullStat } from "@/features/insights/fluida/components/pull-stat";
import { TextBeat } from "@/features/insights/fluida/components/text-beat";
import { useInsightsFluidaScreenController } from "@/features/insights/hooks/use-insights-fluida-screen-controller";
import { AppScreen } from "@/shared/components/app-screen";

export interface InsightsFluidaScreenProps {
  /**
   * Dimension to pre-select when the screen mounts, e.g. opened from a feature
   * page's "ler na íntegra" CTA. Defaults to `general`.
   */
  readonly initialDimension?: InsightDimension;
}

/** Hairline divider between editorial beats. */
function BeatDivider(): ReactElement {
  return <YStack height={borderWidths.hairline} backgroundColor="$borderColor" />;
}

/**
 * "Fluida" insights screen — editorial reading of the AI-generated insights
 * (etapa 1 + 2). Composes the masthead, the editorial lead and the
 * intercalated beats: comparatives ("Como se compara", general only), a
 * drop-cap opening paragraph, the "ritmo de saídas" chart, and a second
 * paragraph paired with a pull-stat. The closing beats (attention list,
 * "where to go next", AI provenance) land in etapa 3.
 *
 * @param props Optional initial dimension (deep link from a feature page).
 * @returns The composed Fluida screen.
 */
export function InsightsFluidaScreen({
  initialDimension,
}: InsightsFluidaScreenProps = {}): ReactElement {
  const controller = useInsightsFluidaScreenController({ initialDimension });
  const { vm } = controller;
  const [firstParagraph, secondParagraph] = vm.paragraphs;
  const pullStat = vm.highlights[0];

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

        <InsightLead lead={vm} />

        {controller.showCompare ? (
          <>
            <CompareBeat items={vm.retro} testID="insights-compare-beat" />
            <BeatDivider />
          </>
        ) : null}

        {firstParagraph ? <TextBeat dropCap>{firstParagraph}</TextBeat> : null}

        <ChartBeat
          series={vm.series}
          cadence={controller.cadence}
          testID="insights-chart-beat"
        />

        {secondParagraph ? <TextBeat>{secondParagraph}</TextBeat> : null}

        {pullStat ? (
          <PullStat highlight={pullStat} testID="insights-pull-stat" />
        ) : null}

        {/* TODO(etapa 3): AlertList (pontos de atenção). */}
        {/* TODO(etapa 3): Seguir ("Para onde seguir agora") + AiMeta (procedência da IA). */}
      </YStack>
    </AppScreen>
  );
}
