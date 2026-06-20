import { type ReactElement, type ReactNode } from "react";

import { act, render, renderHook } from "@testing-library/react-native";

import {
  TourAnchorProvider,
  useTourAnchor,
  useTourAnchorContext,
  type MeasurableHandle,
} from "@/shared/coach-marks/tour-anchor-context";

const wrapper = ({ children }: { children: ReactNode }): ReactElement => (
  <TourAnchorProvider>{children}</TourAnchorProvider>
);

/** Constrói um nó medível fake com coordenadas fixas. */
const fakeNode = (
  rect: { x: number; y: number; width: number; height: number } | "silent",
): MeasurableHandle => ({
  measureInWindow: (cb) => {
    if (rect === "silent") {
      return; // nunca chama o callback (simula nó fora da árvore)
    }
    cb(rect.x, rect.y, rect.width, rect.height);
  },
});

describe("TourAnchorProvider / useTourAnchor", () => {
  it("usa o valor padrão tolerante fora do provider (sem lançar)", async () => {
    const { result } = renderHook(() => useTourAnchorContext());
    // register é no-op e measureAnchor devolve null — não lança.
    expect(() => result.current.register("x", null)).not.toThrow();
    await expect(result.current.measureAnchor("x")).resolves.toBeNull();
  });

  it("o hook de âncora funciona sem provider (registro no-op)", () => {
    const { result } = renderHook(() => useTourAnchor("solo"));
    expect(() => result.current.ref(null)).not.toThrow();
  });

  it("mede uma âncora registrada em coordenadas de janela", async () => {
    const { result } = renderHook(
      () => ({
        anchor: useTourAnchor("cards"),
        ctx: useTourAnchorContext(),
      }),
      { wrapper },
    );

    act(() => {
      result.current.anchor.ref(
        fakeNode({ x: 20, y: 140, width: 320, height: 180 }),
      );
    });

    await expect(result.current.ctx.measureAnchor("cards")).resolves.toEqual({
      left: 20,
      top: 140,
      width: 320,
      height: 180,
    });
  });

  it("devolve null para âncora desconhecida", async () => {
    const { result } = renderHook(() => useTourAnchorContext(), { wrapper });
    await expect(result.current.measureAnchor("inexistente")).resolves.toBeNull();
  });

  it("devolve null após a âncora ser desregistrada", async () => {
    const { result } = renderHook(
      () => ({
        anchor: useTourAnchor("fab"),
        ctx: useTourAnchorContext(),
      }),
      { wrapper },
    );

    act(() => {
      result.current.anchor.ref(fakeNode({ x: 0, y: 0, width: 56, height: 56 }));
    });
    await expect(result.current.ctx.measureAnchor("fab")).resolves.not.toBeNull();

    act(() => {
      result.current.anchor.ref(null);
    });
    await expect(result.current.ctx.measureAnchor("fab")).resolves.toBeNull();
  });

  it("resolve null quando o nó não responde dentro do timeout", async () => {
    jest.useFakeTimers();
    const { result } = renderHook(
      () => ({
        anchor: useTourAnchor("views"),
        ctx: useTourAnchorContext(),
      }),
      { wrapper },
    );

    act(() => {
      result.current.anchor.ref(fakeNode("silent"));
    });

    const pending = result.current.ctx.measureAnchor("views");
    await act(async () => {
      jest.advanceTimersByTime(400);
      await Promise.resolve();
    });
    await expect(pending).resolves.toBeNull();
    jest.useRealTimers();
  });

  it("o onLayout do binding não quebra ao ser chamado", () => {
    const { result } = renderHook(() => useTourAnchor("months"), { wrapper });
    expect(() =>
      result.current.onLayout({
        nativeEvent: { layout: { x: 0, y: 0, width: 10, height: 10 } },
      } as Parameters<typeof result.current.onLayout>[0]),
    ).not.toThrow();
  });

  it("renderiza os filhos do provider", () => {
    const { toJSON } = render(
      <TourAnchorProvider>
        <></>
      </TourAnchorProvider>,
    );
    expect(toJSON()).toBeNull();
  });
});
