import { act, renderHook } from "@testing-library/react-native";

import { useSessionStore } from "@/core/session/session-store";
import { useSessionFailureNotice } from "@/core/session/use-session-failure-notice";

const resetSessionFailureState = (): void => {
  useSessionStore.setState((state) => ({
    ...state,
    authFailureReason: null,
    lastInvalidatedAt: null,
    hydrated: true,
    isAuthenticated: false,
  }));
};

describe("useSessionFailureNotice", () => {
  beforeEach(() => {
    resetSessionFailureState();
  });

  it("expõe o aviso canonico quando a sessao foi invalidada", () => {
    useSessionStore.setState((state) => ({
      ...state,
      authFailureReason: "unauthorized",
      lastInvalidatedAt: "2026-04-10T12:00:00.000Z",
    }));

    const { result } = renderHook(() => useSessionFailureNotice());

    expect(result.current.notice).toEqual({
      title: "Nao foi possivel validar sua sessao",
      description: "Entre novamente para continuar com seguranca.",
      dismissLabel: "Fechar",
    });
  });

  it("permite dispensar o aviso sem restaurar autenticacao", () => {
    useSessionStore.setState((state) => ({
      ...state,
      authFailureReason: "expired",
      lastInvalidatedAt: "2026-04-10T12:05:00.000Z",
    }));

    const { result } = renderHook(() => useSessionFailureNotice());

    act(() => {
      result.current.dismissNotice();
    });

    expect(useSessionStore.getState()).toMatchObject({
      isAuthenticated: false,
      authFailureReason: null,
      lastInvalidatedAt: "2026-04-10T12:05:00.000Z",
    });
  });
});
