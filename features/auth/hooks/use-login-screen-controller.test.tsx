import { act, renderHook } from "@testing-library/react-native";

import { ApiError } from "@/core/http/api-error";
import { useAuthRedirectStore } from "@/core/navigation/auth-redirect-context";
import { useLoginMutation } from "@/features/auth/hooks/use-auth-mutations";
import { useLoginScreenController } from "@/features/auth/hooks/use-login-screen-controller";

const mockReplace = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: mockReplace,
    back: jest.fn(),
    canGoBack: jest.fn(() => false),
  }),
}));

jest.mock("@/features/auth/hooks/use-auth-mutations", () => ({
  useLoginMutation: jest.fn(),
}));

jest.mock("@/core/session/use-session-failure-notice", () => ({
  useSessionFailureNotice: () => ({ notice: null, dismissNotice: jest.fn() }),
}));

const mockedUseLogin = jest.mocked(useLoginMutation);

describe("useLoginScreenController", () => {
  let mutateAsync: jest.Mock;
  let reset: jest.Mock;

  beforeEach(() => {
    mockReplace.mockReset();
    useAuthRedirectStore.setState({ intendedRoute: null });
    mutateAsync = jest.fn().mockResolvedValue(undefined);
    reset = jest.fn();
    mockedUseLogin.mockReturnValue({
      mutateAsync,
      reset,
      isPending: false,
      error: null,
    } as never);
  });

  it("redireciona para /dashboard quando nao ha intent capturado", async () => {
    const { result } = renderHook(() => useLoginScreenController());
    await act(async () => {
      result.current.form.setValue("email", "user@auraxis.com");
      result.current.form.setValue("password", "any-password");
    });
    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(mutateAsync).toHaveBeenCalledWith({
      email: "user@auraxis.com",
      password: "any-password",
    });
    expect(mockReplace).toHaveBeenCalledWith("/dashboard");
  });

  it("consome a rota intencionada do redirect store apos login", async () => {
    useAuthRedirectStore.setState({ intendedRoute: "/metas" });
    const { result } = renderHook(() => useLoginScreenController());
    await act(async () => {
      result.current.form.setValue("email", "user@auraxis.com");
      result.current.form.setValue("password", "any-password");
    });
    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(mockReplace).toHaveBeenCalledWith("/metas");
    expect(useAuthRedirectStore.getState().intendedRoute).toBeNull();
  });

  it("nao redireciona quando a mutation falha", async () => {
    mutateAsync.mockRejectedValueOnce(new ApiError({ message: "bad", status: 401 }));
    const { result } = renderHook(() => useLoginScreenController());
    await act(async () => {
      result.current.form.setValue("email", "user@auraxis.com");
      result.current.form.setValue("password", "any-password");
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(mockReplace).not.toHaveBeenCalled();
  });
});
