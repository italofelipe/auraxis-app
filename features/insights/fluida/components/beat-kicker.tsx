import type { ComponentProps, ReactElement } from "react";

import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Paragraph, XStack, useTheme } from "tamagui";

import { borderWidths, letterSpacings } from "@/config/design-tokens";
import { iconSizes } from "@/shared/theme";

type MaterialCommunityIconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

export interface BeatKickerProps {
  /** Leading glyph for the beat (Material Community icon name). */
  readonly icon: MaterialCommunityIconName;
  /** Short section label, e.g. "Como se compara". */
  readonly label: string;
  readonly testID?: string;
}

/**
 * Section header for an intercalated beat: a small tinted icon chip followed
 * by an uppercase muted label. Mirrors the "kicker" of the design handoff
 * (e.g. "COMO SE COMPARA", "O RITMO DE SAÍDAS"). The chip tint uses the
 * primary-subtle token and the icon the primary token so light/dark resolve
 * automatically.
 *
 * @param props Icon, label and optional test id.
 * @returns The composed beat header row.
 */
export function BeatKicker({ icon, label, testID }: BeatKickerProps): ReactElement {
  const theme = useTheme();

  return (
    <XStack alignItems="center" gap="$2" testID={testID} accessibilityRole="header">
      <XStack
        width={22}
        height={22}
        borderRadius="$1"
        backgroundColor="$primarySubtle"
        borderWidth={borderWidths.hairline}
        borderColor="$primary"
        alignItems="center"
        justifyContent="center"
      >
        <MaterialCommunityIcons
          name={icon}
          size={iconSizes.xs}
          color={theme.primary?.val}
        />
      </XStack>
      <Paragraph
        color="$muted"
        fontFamily="$body"
        fontSize="$1"
        fontWeight="$7"
        letterSpacing={letterSpacings.caps}
        textTransform="uppercase"
      >
        {label}
      </Paragraph>
    </XStack>
  );
}
