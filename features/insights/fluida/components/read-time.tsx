import type { ComponentProps, ReactElement } from "react";

import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Paragraph, XStack, useTheme } from "tamagui";

import { iconSizes } from "@/shared/theme";
import { formatReadTime } from "@/features/insights/fluida/read-time";

export interface ReadTimeProps {
  readonly readMinutes: number;
  readonly testID?: string;
}

type MaterialCommunityIconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

const CLOCK_ICON: MaterialCommunityIconName = "clock-outline";

/**
 * Reading-time badge for the editorial lead: a small clock icon followed
 * by "{n} min de leitura". The icon colour is read from the resolved
 * theme's muted token so it adapts to light/dark.
 *
 * @param props Reading time in minutes and optional test id.
 * @returns A muted reading-time row.
 */
export function ReadTime({ readMinutes, testID }: ReadTimeProps): ReactElement {
  const theme = useTheme();
  const label = formatReadTime(readMinutes);

  return (
    <XStack alignItems="center" gap="$1" testID={testID} accessibilityRole="text">
      <MaterialCommunityIcons
        name={CLOCK_ICON}
        size={iconSizes.xs}
        color={theme.muted?.val}
      />
      <Paragraph color="$muted" fontFamily="$body" fontSize="$1">
        {label}
      </Paragraph>
    </XStack>
  );
}
