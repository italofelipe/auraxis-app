import { renderHook } from "@testing-library/react-native";

import { resetAppShellStore, useAppShellStore } from "@/core/shell/app-shell-store";
import { motionStagger, motionTranslate } from "@/shared/theme";

import {
  REVEAL_FROM_SCALE,
  REVEAL_STAGGER_CAP,
  revealDelay,
  revealFromOffset,
  useRevealAnimation,
} from "./use-reveal-animation";

describe("revealDelay", () => {
  it("não atrasa o primeiro item (índice 0)", () => {
    expect(revealDelay(0)).toBe(0);
  });

  it("escalona o atraso por índice usando o token de stagger", () => {
    expect(revealDelay(1)).toBe(motionStagger);
    expect(revealDelay(3)).toBe(3 * motionStagger);
  });

  it("limita o atraso no cap para não acumular em listas longas", () => {
    expect(revealDelay(REVEAL_STAGGER_CAP + 7)).toBe(
      REVEAL_STAGGER_CAP * motionStagger,
    );
  });

  it("trata índice negativo como zero (sem atraso negativo)", () => {
    expect(revealDelay(-3)).toBe(0);
  });
});

describe("revealFromOffset", () => {
  it("parte deslocado em Y e levemente reduzido quando há movimento", () => {
    expect(revealFromOffset(false)).toEqual({
      translateY: motionTranslate.revealY,
      scale: REVEAL_FROM_SCALE,
    });
  });

  it("parte do repouso (sem deslocamento) quando 'reduzir movimento' está ativo", () => {
    expect(revealFromOffset(true)).toEqual({ translateY: 0, scale: 1 });
  });
});

describe("useRevealAnimation", () => {
  beforeEach(() => {
    resetAppShellStore();
  });

  it("anima apenas transform — nunca opacidade (sem fade)", () => {
    const { result } = renderHook(() => useRevealAnimation(0));

    expect(result.current).toHaveProperty("transform");
    expect(result.current).not.toHaveProperty("opacity");
  });

  it("compõe translateY e scale no transform de entrada", () => {
    const { result } = renderHook(() => useRevealAnimation(0));

    const keys = result.current.transform.flatMap((entry) =>
      Object.keys(entry),
    );

    expect(keys).toContain("translateY");
    expect(keys).toContain("scale");
  });

  it("permanece em repouso quando 'reduzir movimento' está ativo", () => {
    useAppShellStore.getState().setReducedMotionEnabled(true);

    const { result } = renderHook(() => useRevealAnimation(5));

    expect(result.current.transform).toContainEqual({ translateY: 0 });
    expect(result.current.transform).toContainEqual({ scale: 1 });
  });
});
