import { useEffect } from "react";

import {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";

import { useAppShellStore } from "@/core/shell/app-shell-store";
import { motionDurations, motionEasings, motionStagger } from "@/shared/theme";

/** Geometry of a single bar at a given growth progress. */
export interface BarGeometry {
  /** Drawn height of the bar (px). */
  readonly height: number;
  /** Top edge (SVG y), pinned to the baseline as the bar grows upward. */
  readonly y: number;
}

/** Inputs describing a bar's final (rest) size within the chart viewBox. */
export interface BarGrowInput {
  /** Final bar height at rest (px). */
  readonly height: number;
  /** Chart viewBox height — the baseline bars grow up from (px). */
  readonly chartHeight: number;
  /** Position in the row; scales the entrance delay (left-to-right). */
  readonly index?: number;
}

/**
 * Initial growth progress for a bar entrance. With motion allowed the bar
 * starts collapsed (`0`) and grows to full; with "reduce motion" on it starts
 * already at rest (`1`) so there is no animation and the base state shows
 * immediately.
 *
 * @param reducedMotion Whether the user asked to reduce motion.
 * @returns `0` (animate in) or `1` (rest immediately).
 */
export const barGrowInitialProgress = (reducedMotion: boolean): number => {
  return reducedMotion ? 1 : 0;
};

/**
 * Resolves the drawn geometry of a bar for a growth `progress` in `[0, 1]`.
 * At `0` the bar is zero-height sitting on the baseline; at `1` it reaches its
 * full `height` with the top at `chartHeight - height`. The bar always grows
 * upward from the baseline, so the final (rest) state is the fully-drawn bar.
 *
 * @param input Growth progress plus the bar's final height and the baseline.
 * @returns The `height`/`y` to feed the rect at this progress.
 */
export const barGrowGeometry = ({
  progress,
  height,
  chartHeight,
}: {
  readonly progress: number;
  readonly height: number;
  readonly chartHeight: number;
}): BarGeometry => {
  const drawn = height * progress;
  return {
    height: drawn,
    y: chartHeight - drawn,
  };
};

/**
 * Animates a chart bar growing up from the baseline to its final height over
 * ~0.5s (`motionDurations.expressive`), staggered by `index`. It animates only
 * the bar's `height`/`y` — the rest state is the fully-drawn bar, so a bar is
 * never left stuck invisible. Honours the "reduce motion" preference by
 * settling at the final geometry immediately.
 *
 * The return type is intentionally inferred from `useAnimatedProps` (Reanimated
 * widens the animated prop shape to a `Partial`); annotating it collapses the
 * shape and stops matching the `animatedProps` of the animated `<Rect>`.
 *
 * @param input The bar's final height, the chart baseline and its row index.
 * @returns `{ animatedProps }` to feed an `Animated.createAnimatedComponent(Rect)`.
 */
export function useBarGrowAnimation({
  height,
  chartHeight,
  index = 0,
}: BarGrowInput) {
  const reducedMotion = useAppShellStore((state) => state.reducedMotionEnabled);
  const progress = useSharedValue(barGrowInitialProgress(reducedMotion));

  useEffect(() => {
    if (reducedMotion) {
      progress.value = 1;
      return;
    }

    const delay = index * motionStagger;
    progress.value = withDelay(
      delay,
      withTiming(1, {
        duration: motionDurations.expressive,
        easing: Easing.bezier(...motionEasings.emphasized),
      }),
    );
  }, [chartHeight, height, index, progress, reducedMotion]);

  const animatedProps = useAnimatedProps(() =>
    barGrowGeometry({ progress: progress.value, height, chartHeight }),
  );

  return { animatedProps };
}
