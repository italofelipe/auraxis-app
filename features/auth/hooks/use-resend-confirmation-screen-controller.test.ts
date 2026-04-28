import { act, renderHook, waitFor } from "@testing-library/react-native";

import { resetSessionStore, useSessionStore } from "@/core/session/session-store";
import {
  useResendConfirmationMutation,
} from "@/features/auth/hooks/use-auth-mutations";
import { useResendConfirmationScreenController } from "@/features/auth/hooks/use-resend-confirmation-screen-controller";

jest.mock("expo-router", () => ({
  useRouter: () => ({ replace: jest.fn(), push: jest.fn(), back: jest.fn() }),
}));

jest.mock("@/features/auth/hooks/use-auth-mutations", () => ({
  useResendConfirmationMutation: jest.fn(),
}));

const mockedUseResendConfirmationMutation = jest.mocked(
  useResendConfirmationMutation,
);

const buildMutation = (overrides: Partial<ReturnType<typeof useResendConfirmationMutation>> = {}) => {
  return {
    mutateAsync: jest.fn().mockResolvedValue(undefined),
    isPending: false,
    error: null,
    reset: jest.fn(),
    ...overrides,
  } as unknown as ReturnType<typeof useResendConfirmationMutation>;
};

describe("useResendConfirmationScreenController", () => {
  beforeEach(() => {
    resetSessionStore();
    mockedUseResendConfirmationMutation.mockReturnValue(buildMutation());
  });

  it("preenche email da sessao quando autenticado", () => {
    useSessionStore.setState({ userEmail: "user@example.com" } as never);
    const { result } = renderHook(() => useResendConfirmationScreenController());
    expect(result.current.email).toBe("user@example.com");
    expect(result.current.canEditEmail).toBe(false);
  });

  it("permite edicao quando nao ha email na sessao", () => {
    useSessionStore.setState({ userEmail: null } as never);
    const { result } = renderHook(() => useResendConfirmationScreenController());
    expect(result.current.canEditEmail).toBe(true);
  });

  it("dispara mutation e marca sucesso", async () => {
    const mutateAsync = jest.fn().mockResolvedValue(undefined);
    mockedUseResendConfirmationMutation.mockReturnValue(
      buildMutation({ mutateAsync } as never),
    );

    const { result } = renderHook(() => useResendConfirmationScreenController());

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(mutateAsync).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(result.current.hasSucceeded).toBe(true);
    });
  });

  it("aplica rate limit local de 60 segundos apos sucesso", async () => {
    const mutateAsync = jest.fn().mockResolvedValue(undefined);
    mockedUseResendConfirmationMutation.mockReturnValue(
      buildMutation({ mutateAsync } as never),
    );

    const { result } = renderHook(() => useResendConfirmationScreenController());

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(result.current.remainingSeconds).toBeGreaterThan(0);
    expect(result.current.remainingSeconds).toBeLessThanOrEqual(60);

    // Tentar de novo deve no-op enquanto restante > 0
    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(mutateAsync).toHaveBeenCalledTimes(1);
  });

  it("mantem hasSucceeded falso quando mutation falha", async () => {
    const mutateAsync = jest.fn().mockRejectedValue(new Error("boom"));
    mockedUseResendConfirmationMutation.mockReturnValue(
      buildMutation({ mutateAsync } as never),
    );

    const { result } = renderHook(() => useResendConfirmationScreenController());

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(result.current.hasSucceeded).toBe(false);
  });
});
