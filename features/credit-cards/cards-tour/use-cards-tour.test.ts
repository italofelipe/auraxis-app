import { act, renderHook, waitFor } from "@testing-library/react-native";
import type { ScrollView as NativeScrollView } from "react-native";

import {
  useCardsTour,
  type CardsTourControllerHandlers,
} from "@/features/credit-cards/cards-tour/use-cards-tour";
import {
  loadCardsTourSeen,
  persistCardsTourSeen,
} from "@/features/credit-cards/services/cards-tour-seen-storage";
import type { Rect } from "@/shared/coach-marks/coach-marks-geometry";

jest.mock("@/features/credit-cards/services/cards-tour-seen-storage", () => ({
  loadCardsTourSeen: jest.fn(),
  persistCardsTourSeen: jest.fn().mockResolvedValue(undefined),
}));

const mockLoadSeen = jest.mocked(loadCardsTourSeen);
const mockPersistSeen = jest.mocked(persistCardsTourSeen);

const makeHandlers = (): jest.Mocked<CardsTourControllerHandlers> => ({
  setView: jest.fn(),
  selectCard: jest.fn(),
});

const makeScrollRef = (): {
  ref: React.RefObject<NativeScrollView | null>;
  scrollTo: jest.Mock;
} => {
  const scrollTo = jest.fn();
  const ref = {
    current: { scrollTo } as unknown as NativeScrollView,
  };
  return { ref, scrollTo };
};

// eslint-disable-next-line max-lines-per-function
describe("useCardsTour", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLoadSeen.mockResolvedValue(true);
  });

  it("expõe os 8 passos visuais com a copy", () => {
    const { ref } = makeScrollRef();
    const { result } = renderHook(() =>
      useCardsTour({
        handlers: makeHandlers(),
        scrollRef: ref,
        measureAnchor: jest.fn().mockResolvedValue(null),
        autoOpenEnabled: false,
      }),
    );
    expect(result.current.steps).toHaveLength(8);
    expect(result.current.steps[0].title).toBe("Seus cartões em um só lugar");
    expect(result.current.steps[0].center).toBe(true);
  });

  it("NÃO abre automaticamente quando o tour já foi visto", async () => {
    mockLoadSeen.mockResolvedValue(true);
    const { ref } = makeScrollRef();
    const { result } = renderHook(() =>
      useCardsTour({
        handlers: makeHandlers(),
        scrollRef: ref,
        measureAnchor: jest.fn().mockResolvedValue(null),
      }),
    );
    await waitFor(() => expect(mockLoadSeen).toHaveBeenCalled());
    expect(result.current.active).toBe(false);
  });

  it("abre automaticamente na primeira visita (não visto)", async () => {
    mockLoadSeen.mockResolvedValue(false);
    const { ref } = makeScrollRef();
    const { result } = renderHook(() =>
      useCardsTour({
        handlers: makeHandlers(),
        scrollRef: ref,
        measureAnchor: jest.fn().mockResolvedValue(null),
      }),
    );
    await waitFor(() => expect(result.current.active).toBe(true));
  });

  it("respeita autoOpenEnabled=false (não checa o storage)", async () => {
    const { ref } = makeScrollRef();
    const { result } = renderHook(() =>
      useCardsTour({
        handlers: makeHandlers(),
        scrollRef: ref,
        measureAnchor: jest.fn().mockResolvedValue(null),
        autoOpenEnabled: false,
      }),
    );
    expect(result.current.active).toBe(false);
    expect(mockLoadSeen).not.toHaveBeenCalled();
  });

  it("open() reabre o tour (replay do botão ?)", () => {
    const { ref } = makeScrollRef();
    const { result } = renderHook(() =>
      useCardsTour({
        handlers: makeHandlers(),
        scrollRef: ref,
        measureAnchor: jest.fn().mockResolvedValue(null),
        autoOpenEnabled: false,
      }),
    );
    act(() => {
      result.current.open();
    });
    expect(result.current.active).toBe(true);
  });

  it("onFinish fecha o tour e persiste 'visto'", () => {
    const { ref } = makeScrollRef();
    const { result } = renderHook(() =>
      useCardsTour({
        handlers: makeHandlers(),
        scrollRef: ref,
        measureAnchor: jest.fn().mockResolvedValue(null),
        autoOpenEnabled: false,
      }),
    );
    act(() => {
      result.current.open();
    });
    act(() => {
      result.current.onFinish();
    });
    expect(result.current.active).toBe(false);
    expect(mockPersistSeen).toHaveBeenCalledTimes(1);
  });

  it("before() do passo 1 reseta cartão, fixa view 'faturas' e rola ao topo", async () => {
    const handlers = makeHandlers();
    const { ref, scrollTo } = makeScrollRef();
    const { result } = renderHook(() =>
      useCardsTour({
        handlers,
        scrollRef: ref,
        measureAnchor: jest.fn().mockResolvedValue(null),
        autoOpenEnabled: false,
      }),
    );

    await act(async () => {
      await result.current.steps[0].before?.();
    });

    expect(handlers.selectCard).toHaveBeenCalledWith(null);
    expect(handlers.setView).toHaveBeenCalledWith("faturas");
    expect(scrollTo).toHaveBeenCalledWith({ y: 0, animated: false });
  });

  it("before() do passo da fatura rola até o card medido", async () => {
    const handlers = makeHandlers();
    const { ref, scrollTo } = makeScrollRef();
    const measureAnchor = jest.fn(async (key: string): Promise<Rect | null> => {
      if (key === "fatura") {
        return { top: 600, left: 0, width: 300, height: 160 };
      }
      if (key === "__scroll_origin") {
        return { top: 80, left: 0, width: 360, height: 10 };
      }
      return null;
    });
    const { result } = renderHook(() =>
      useCardsTour({
        handlers,
        scrollRef: ref,
        measureAnchor,
        autoOpenEnabled: false,
      }),
    );

    const faturaStep = result.current.steps.find((step) => step.id === "fatura");
    await act(async () => {
      await faturaStep?.before?.();
    });

    expect(handlers.setView).toHaveBeenCalledWith("faturas");
    // delta = 600 - 80 - 140 = 380
    expect(scrollTo).toHaveBeenCalledWith({ y: 380, animated: false });
  });

  it("before() da fatura aborta a rolagem quando a medição falha", async () => {
    const { ref, scrollTo } = makeScrollRef();
    const measureAnchor = jest.fn().mockResolvedValue(null);
    const { result } = renderHook(() =>
      useCardsTour({
        handlers: makeHandlers(),
        scrollRef: ref,
        measureAnchor,
        autoOpenEnabled: false,
      }),
    );

    const faturaStep = result.current.steps.find((step) => step.id === "fatura");
    await act(async () => {
      await faturaStep?.before?.();
    });
    expect(scrollTo).not.toHaveBeenCalled();
  });

  it("before() do passo Mais não altera view nem rola", async () => {
    const handlers = makeHandlers();
    const { ref, scrollTo } = makeScrollRef();
    const { result } = renderHook(() =>
      useCardsTour({
        handlers,
        scrollRef: ref,
        measureAnchor: jest.fn().mockResolvedValue(null),
        autoOpenEnabled: false,
      }),
    );

    const moreStep = result.current.steps.find((step) => step.id === "more");
    await act(async () => {
      await moreStep?.before?.();
    });
    expect(handlers.setView).not.toHaveBeenCalled();
    expect(handlers.selectCard).not.toHaveBeenCalled();
    expect(scrollTo).not.toHaveBeenCalled();
  });
});
