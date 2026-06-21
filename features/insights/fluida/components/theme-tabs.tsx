import type { ReactElement } from "react";

import { Paragraph, ScrollView, XStack, YStack } from "tamagui";

import { borderWidths } from "@/config/design-tokens";
import { triggerHapticImpact } from "@/shared/feedback/haptics";
import type { InsightDimension } from "@/features/insights/contracts";
import type { InsightDimensionTab } from "@/features/insights/hooks/use-insights-fluida-screen-controller";

export interface ThemeTabsProps {
  readonly tabs: readonly InsightDimensionTab[];
  readonly value: InsightDimension;
  readonly onChange: (value: InsightDimension) => void;
  readonly testID?: string;
}

/**
 * Horizontally scrollable theme tabs (Geral · Transações · Metas ·
 * Orçamentos · Cartões) for the masthead. The active tab is a filled
 * primary pill; inactive tabs are outlined and muted. Presentational —
 * selection state arrives via props.
 *
 * @param props Tab definitions, the active dimension and a change handler.
 * @returns A scrollable row of theme tabs.
 */
export function ThemeTabs({
  tabs,
  value,
  onChange,
  testID,
}: ThemeTabsProps): ReactElement {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      testID={testID ?? "insights-theme-tabs"}
    >
      <XStack gap="$2" paddingVertical="$1">
        {tabs.map((tab) => {
          const isActive = tab.value === value;
          return (
            <YStack
              key={tab.value}
              alignItems="center"
              justifyContent="center"
              paddingHorizontal="$3"
              paddingVertical="$2"
              borderRadius="$5"
              borderWidth={borderWidths.hairline}
              backgroundColor={isActive ? "$primary" : "transparent"}
              borderColor={isActive ? "$primary" : "$borderColor"}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={tab.label}
              testID={`insights-theme-tab-${tab.value}`}
              pressStyle={{ opacity: 0.85 }}
              onPress={() => {
                triggerHapticImpact("light");
                onChange(tab.value);
              }}
            >
              <Paragraph
                fontFamily="$body"
                fontSize="$2"
                fontWeight={isActive ? "$7" : "$5"}
                color={isActive ? "$actionPrimaryForeground" : "$muted"}
              >
                {tab.label}
              </Paragraph>
            </YStack>
          );
        })}
      </XStack>
    </ScrollView>
  );
}
