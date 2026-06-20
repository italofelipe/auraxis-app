import type { ReactElement, ReactNode } from "react";

import { LinearGradient } from "expo-linear-gradient";
import type { StyleProp, ViewStyle } from "react-native";

import { semanticRadii, type GradientStops } from "@/shared/theme";

/**
 * Tamagui radius token names (`$1`–`$5`) accepted by the layout primitives,
 * resolved here to concrete numbers because `LinearGradient` is a plain RN
 * `View`, not a Tamagui component, so it can't consume `$token` strings.
 */
export type RadiusToken = "$0" | "$1" | "$2" | "$3" | "$4" | "$5";

const RADIUS_TOKEN_VALUE: Record<RadiusToken, number> = {
  $0: 0,
  $1: semanticRadii.sm,
  $2: semanticRadii.md,
  $3: semanticRadii.lg,
  $4: semanticRadii.xl,
  $5: semanticRadii.pill,
};

interface AppGradientBaseProps {
  /** Border radius as a DS token (resolved to a number internally). */
  readonly borderRadius?: RadiusToken;
  readonly style?: StyleProp<ViewStyle>;
  readonly children?: ReactNode;
  readonly testID?: string;
}

interface AppGradientFromStopsProps extends AppGradientBaseProps {
  /** Full gradient definition (`{ colors, start, end }`) from `@/shared/theme`. */
  readonly gradient: GradientStops;
  readonly colors?: never;
  readonly start?: never;
  readonly end?: never;
}

interface AppGradientFromPartsProps extends AppGradientBaseProps {
  readonly gradient?: never;
  /** At least two colours, "inline" or `as const` so the tuple type is kept. */
  readonly colors: readonly [string, string, ...string[]];
  readonly start?: GradientStops["start"];
  readonly end?: GradientStops["end"];
}

export type AppGradientProps =
  | AppGradientFromStopsProps
  | AppGradientFromPartsProps;

const DEFAULT_START: GradientStops["start"] = { x: 0, y: 0 };
const DEFAULT_END: GradientStops["end"] = { x: 1, y: 1 };

/**
 * Thin wrapper over `expo-linear-gradient` that speaks the DS gradient shape.
 * Pass a whole `gradient` token (hero, card faces, CTAs) or raw
 * `colors`/`start`/`end`. The radius comes in as a DS token and is resolved to
 * a number so the gradient corners clip correctly.
 *
 * @param props A `gradient` token OR `colors` (+ optional start/end), plus
 *              optional `borderRadius`, `style` and children.
 * @returns A themed `LinearGradient` view.
 */
export function AppGradient(props: AppGradientProps): ReactElement {
  const { borderRadius, style, children, testID } = props;

  const colors = props.gradient ? props.gradient.colors : props.colors;
  const start = props.gradient ? props.gradient.start : props.start ?? DEFAULT_START;
  const end = props.gradient ? props.gradient.end : props.end ?? DEFAULT_END;

  const radiusStyle: ViewStyle | undefined =
    borderRadius === undefined
      ? undefined
      : { borderRadius: RADIUS_TOKEN_VALUE[borderRadius] };

  return (
    <LinearGradient
      colors={colors}
      start={start}
      end={end}
      style={[radiusStyle, style]}
      testID={testID}
    >
      {children}
    </LinearGradient>
  );
}
