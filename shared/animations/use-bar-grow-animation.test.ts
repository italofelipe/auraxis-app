import { renderHook } from "@testing-library/react-native";

import { resetAppShellStore, useAppShellStore } from "@/core/shell/app-shell-store";

import {
  barGrowGeometry,
  barGrowInitialProgress,
  useBarGrowAnimation,
} from "./use-bar-grow-animation";

describe("barGrowInitialProgress", () => {
  it("starts collapsed (0) so the bar grows in when motion is allowed", () => {
    expect(barGrowInitialProgress(false)).toBe(0);
  });

  it("starts at rest (1) when 'reduce motion' is on — no animation, base state", () => {
    expect(barGrowInitialProgress(true)).toBe(1);
  });
});

describe("barGrowGeometry", () => {
  it("maps progress 0 to a zero-height bar pinned at the baseline", () => {
    expect(barGrowGeometry({ progress: 0, height: 60, chartHeight: 90 })).toEqual({
      height: 0,
      y: 90,
    });
  });

  it("maps progress 1 to the full bar resting at its final position (base state)", () => {
    expect(barGrowGeometry({ progress: 1, height: 60, chartHeight: 90 })).toEqual({
      height: 60,
      y: 30,
    });
  });

  it("grows the bar upward from the baseline at the midpoint", () => {
    expect(barGrowGeometry({ progress: 0.5, height: 60, chartHeight: 90 })).toEqual({
      height: 30,
      y: 60,
    });
  });
});

describe("useBarGrowAnimation", () => {
  beforeEach(() => {
    resetAppShellStore();
  });

  it("drives an animated rect via numeric height/y props bound to the baseline", () => {
    const { result } = renderHook(() =>
      useBarGrowAnimation({ height: 60, chartHeight: 90 }),
    );

    // The hook always yields the rect geometry (height + baseline-anchored y);
    // the resting target is locked by `barGrowGeometry(progress: 1)` above and
    // by the reduce-motion path below, so a bar is never left stuck invisible.
    const { height, y } = result.current.animatedProps;
    expect(typeof height).toBe("number");
    expect(typeof y).toBe("number");
    expect(Number(height) + Number(y)).toBe(90);
  });

  it("renders the final geometry immediately when 'reduce motion' is on", () => {
    useAppShellStore.getState().setReducedMotionEnabled(true);

    const { result } = renderHook(() =>
      useBarGrowAnimation({ height: 42, chartHeight: 90 }),
    );

    expect(result.current.animatedProps).toEqual({ height: 42, y: 48 });
  });
});
