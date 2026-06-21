import type { ReactElement } from "react";

import { Paragraph, XStack, YStack } from "tamagui";

import type { InsightDimension } from "@/features/insights/contracts";
import type { InsightCadence } from "@/features/insights/fluida/contracts";
import { CadenceToggle } from "@/features/insights/fluida/components/cadence-toggle";
import { ThemeModeToggle } from "@/features/insights/fluida/components/theme-mode-toggle";
import { ThemeTabs } from "@/features/insights/fluida/components/theme-tabs";
import type {
  InsightCadenceOption,
  InsightDimensionTab,
} from "@/features/insights/hooks/use-insights-fluida-screen-controller";

export interface InsightsMastheadProps {
  readonly cadence: InsightCadence;
  readonly dimension: InsightDimension;
  readonly cadenceOptions: readonly InsightCadenceOption[];
  readonly dimensionTabs: readonly InsightDimensionTab[];
  readonly isDark: boolean;
  readonly onSelectCadence: (cadence: InsightCadence) => void;
  readonly onSelectDimension: (dimension: InsightDimension) => void;
  readonly onToggleTheme: () => void;
}

/**
 * Top masthead of the "Fluida" insights screen: the section title, the
 * cadence segmented control and theme-mode toggle on one row, and the
 * scrollable theme tabs below. Fully presentational — every piece of state
 * and every handler comes from the screen controller via props.
 *
 * @param props Masthead state and handlers from the controller.
 * @returns The composed masthead block.
 */
export function InsightsMasthead({
  cadence,
  dimension,
  cadenceOptions,
  dimensionTabs,
  isDark,
  onSelectCadence,
  onSelectDimension,
  onToggleTheme,
}: InsightsMastheadProps): ReactElement {
  return (
    <YStack gap="$3" testID="insights-masthead">
      <XStack alignItems="center" justifyContent="space-between" gap="$3">
        <YStack flex={1} gap="$1">
          <Paragraph color="$primary" fontFamily="$heading" fontSize="$6" fontWeight="$7">
            Insights de IA
          </Paragraph>
          <Paragraph color="$muted" fontFamily="$body" fontSize="$2">
            {cadence === "weekly" ? "Leitura semanal" : "Leitura diária"}
          </Paragraph>
        </YStack>
        <ThemeModeToggle isDark={isDark} onToggle={onToggleTheme} />
      </XStack>

      <CadenceToggle
        options={cadenceOptions}
        value={cadence}
        onChange={onSelectCadence}
      />

      <ThemeTabs tabs={dimensionTabs} value={dimension} onChange={onSelectDimension} />
    </YStack>
  );
}
