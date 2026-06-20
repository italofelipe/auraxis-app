import { act, renderHook } from "@testing-library/react-native";

import type { Rect } from "@/shared/coach-marks/coach-marks-geometry";
import {
  DEFAULT_SETTLE_DELAY_MS,
  NO_BEFORE_SETTLE_DELAY_MS,
  useCoachMarks,
  type CoachMarkStep,
} from "@/shared/coach-marks/use-coach-marks";

const RECT: Rect = { top: 100, left: 20, width: 300, height: 120 };

const buildSteps = (
  before?: () => void | Promise<void>,
): readonly CoachMarkStep[] => [
  { id: "intro", anchorKey: null, center: true, padding: 0, radius: 16 },
  { id: "cards", anchorKey: "cards", center: false, padding: 10, radius: 16, before },
  { id: "fab", anchorKey: "fab", center: false, padding: 6, radius: 999 },
  { id: "outro", anchorKey: null, center: true, padding: 0, radius: 16 },
];

/**
 * Avança os timers fake e libera a microtask queue, drenando tanto o
 * `setTimeout` de settle quanto a Promise da medição/`before()`.
 */
const flush = async (ms: number): Promise<void> => {
  await act(async () => {
    jest.advanceTimersByTime(ms);
    await Promise.resolve();
    await Promise.resolve();
  });
};

// eslint-disable-next-line max-lines-per-function
describe("useCoachMarks", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("começa no passo 0, centralizado e pronto", async () => {
    const measureAnchor = jest.fn().mockResolvedValue(RECT);
    const { result } = renderHook(() =>
      useCoachMarks({
        steps: buildSteps(),
        active: true,
        measureAnchor,
        onFinish: jest.fn(),
      }),
    );

    expect(result.current.index).toBe(0);
    expect(result.current.isFirst).toBe(true);
    expect(result.current.isLast).toBe(false);

    await flush(NO_BEFORE_SETTLE_DELAY_MS);

    expect(result.current.phase).toBe("ready");
    expect(result.current.isCentered).toBe(true);
    expect(result.current.rect).toBeNull();
    // Passo central não mede a âncora.
    expect(measureAnchor).not.toHaveBeenCalled();
  });

  it("mede o alvo e expõe o recorte num passo com âncora", async () => {
    const measureAnchor = jest.fn().mockResolvedValue(RECT);
    const { result } = renderHook(() =>
      useCoachMarks({
        steps: buildSteps(),
        active: true,
        measureAnchor,
        onFinish: jest.fn(),
      }),
    );

    act(() => {
      result.current.next();
    });
    expect(result.current.index).toBe(1);

    await flush(NO_BEFORE_SETTLE_DELAY_MS);

    expect(measureAnchor).toHaveBeenCalledWith("cards");
    expect(result.current.rect).toEqual(RECT);
    expect(result.current.isCentered).toBe(false);
  });

  it("cai para centralizado quando a medição é inválida", async () => {
    const measureAnchor = jest
      .fn()
      .mockResolvedValue({ top: 0, left: 0, width: 0, height: 0 });
    const { result } = renderHook(() =>
      useCoachMarks({
        steps: buildSteps(),
        active: true,
        measureAnchor,
        onFinish: jest.fn(),
      }),
    );

    act(() => {
      result.current.next();
    });
    await flush(NO_BEFORE_SETTLE_DELAY_MS);

    expect(measureAnchor).toHaveBeenCalledWith("cards");
    expect(result.current.phase).toBe("ready");
    expect(result.current.rect).toBeNull();
    expect(result.current.isCentered).toBe(true);
  });

  it("cai para centralizado quando a medição rejeita", async () => {
    const measureAnchor = jest.fn().mockRejectedValue(new Error("boom"));
    const { result } = renderHook(() =>
      useCoachMarks({
        steps: buildSteps(),
        active: true,
        measureAnchor,
        onFinish: jest.fn(),
      }),
    );

    act(() => {
      result.current.next();
    });
    await flush(NO_BEFORE_SETTLE_DELAY_MS);

    expect(measureAnchor).toHaveBeenCalledWith("cards");
    expect(result.current.phase).toBe("ready");
    expect(result.current.rect).toBeNull();
  });

  it("navega para frente e para trás respeitando os limites", async () => {
    const { result } = renderHook(() =>
      useCoachMarks({
        steps: buildSteps(),
        active: true,
        measureAnchor: jest.fn().mockResolvedValue(RECT),
        onFinish: jest.fn(),
      }),
    );

    act(() => {
      result.current.back();
    });
    expect(result.current.index).toBe(0); // não passa de 0

    act(() => {
      result.current.next();
    });
    expect(result.current.index).toBe(1);
    await flush(NO_BEFORE_SETTLE_DELAY_MS);

    act(() => {
      result.current.back();
    });
    expect(result.current.index).toBe(0);
  });

  it("chama onFinish ao avançar no último passo", async () => {
    const onFinish = jest.fn();
    const { result } = renderHook(() =>
      useCoachMarks({
        steps: buildSteps(),
        active: true,
        measureAnchor: jest.fn().mockResolvedValue(RECT),
        onFinish,
      }),
    );

    act(() => {
      result.current.next();
    });
    await flush(NO_BEFORE_SETTLE_DELAY_MS);
    act(() => {
      result.current.next();
    });
    await flush(NO_BEFORE_SETTLE_DELAY_MS);
    act(() => {
      result.current.next();
    });
    await flush(NO_BEFORE_SETTLE_DELAY_MS);
    expect(result.current.index).toBe(3);
    expect(result.current.isLast).toBe(true);

    act(() => {
      result.current.next();
    });
    expect(onFinish).toHaveBeenCalledTimes(1);
    // Não ultrapassa o último índice.
    expect(result.current.index).toBe(3);
  });

  it("skip encerra o tour imediatamente", () => {
    const onFinish = jest.fn();
    const { result } = renderHook(() =>
      useCoachMarks({
        steps: buildSteps(),
        active: true,
        measureAnchor: jest.fn().mockResolvedValue(RECT),
        onFinish,
      }),
    );

    act(() => {
      result.current.skip();
    });
    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it("executa before() antes de medir e aguarda o settle delay", async () => {
    const order: string[] = [];
    const before = jest.fn(async () => {
      order.push("before");
    });
    const measureAnchor = jest.fn(async (key: string) => {
      order.push(`measure:${key}`);
      return RECT;
    });

    const { result } = renderHook(() =>
      useCoachMarks({
        steps: buildSteps(before),
        active: true,
        measureAnchor,
        onFinish: jest.fn(),
        settleDelayMs: DEFAULT_SETTLE_DELAY_MS,
      }),
    );

    act(() => {
      result.current.next();
    });

    // before() roda (microtask) mas a medição só após o timer de settle.
    await act(async () => {
      await Promise.resolve();
    });
    expect(before).toHaveBeenCalled();
    expect(measureAnchor).not.toHaveBeenCalled();

    await flush(DEFAULT_SETTLE_DELAY_MS);

    expect(measureAnchor).toHaveBeenCalledWith("cards");
    expect(order).toEqual(["before", "measure:cards"]);
  });

  it("reseta para o primeiro passo quando reaberto", async () => {
    const measureAnchor = jest.fn().mockResolvedValue(RECT);
    const { result, rerender } = renderHook(
      ({ active }: { active: boolean }) =>
        useCoachMarks({
          steps: buildSteps(),
          active,
          measureAnchor,
          onFinish: jest.fn(),
        }),
      { initialProps: { active: true } },
    );

    act(() => {
      result.current.next();
    });
    expect(result.current.index).toBe(1);
    await flush(NO_BEFORE_SETTLE_DELAY_MS);

    // Fecha e reabre.
    act(() => {
      rerender({ active: false });
    });
    act(() => {
      rerender({ active: true });
    });
    expect(result.current.index).toBe(0);
  });
});
