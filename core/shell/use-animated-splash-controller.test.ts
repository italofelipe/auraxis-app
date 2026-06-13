import { act, renderHook } from "@testing-library/react-native";

import { useAppShellStore } from "@/core/shell/app-shell-store";
import {
  SPLASH_FADE_DURATION_MS,
  SPLASH_MIN_DURATION_MS,
  useAnimatedSplashController,
} from "@/core/shell/use-animated-splash-controller";

describe("useAnimatedSplashController", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    useAppShellStore.setState({ reducedMotionEnabled: false });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("mantem o overlay visivel enquanto o startup nao esta pronto", () => {
    const { result } = renderHook(() => useAnimatedSplashController(false));

    act(() => {
      jest.advanceTimersByTime(SPLASH_MIN_DURATION_MS * 3);
    });

    expect(result.current.visible).toBe(true);
    expect(result.current.phase).toBe("animating");
  });

  it("respeita a duracao minima mesmo com startup pronto cedo", () => {
    const { result, rerender } = renderHook(
      ({ ready }: { readonly ready: boolean }) => useAnimatedSplashController(ready),
      { initialProps: { ready: true } },
    );

    act(() => {
      jest.advanceTimersByTime(SPLASH_MIN_DURATION_MS / 2);
    });
    rerender({ ready: true });
    expect(result.current.phase).toBe("animating");

    act(() => {
      jest.advanceTimersByTime(SPLASH_MIN_DURATION_MS);
    });
    expect(result.current.phase).toBe("fading");

    act(() => {
      jest.advanceTimersByTime(SPLASH_FADE_DURATION_MS + 50);
    });
    expect(result.current.visible).toBe(false);
  });

  it("dispensa a duracao minima quando reduced motion esta ativo", () => {
    useAppShellStore.setState({ reducedMotionEnabled: true });
    const { result } = renderHook(() => useAnimatedSplashController(true));

    act(() => {
      jest.advanceTimersByTime(SPLASH_FADE_DURATION_MS + 50);
    });

    expect(result.current.visible).toBe(false);
  });
});
