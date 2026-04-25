import { act, renderHook } from "@testing-library/react-native";

import { ApiError } from "@/core/http/api-error";
import { useResetPasswordMutation } from "@/features/auth/hooks/use-auth-mutations";
import { useResetPasswordScreenController } from "@/features/auth/hooks/use-reset-password-screen-controller";

const mockReplace = jest.fn();
let mockTokenParam: string | string[] | undefined = "tok-123";

jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: mockReplace,
    back: jest.fn(),
    canGoBack: jest.fn(() => false),
  }),
  useLocalSearchParams: () => ({ token: mockTokenParam }),
}));

jest.mock("@/features/auth/hooks/use-auth-mutations", () => ({
  useResetPasswordMutation: jest.fn(),
}));

const mockedUseReset = jest.mocked(useResetPasswordMutation);

describe("useResetPasswordScreenController", () => {
  let mutateAsync: jest.Mock;
  let reset: jest.Mock;

  beforeEach(() => {
    mockReplace.mockReset();
    mockTokenParam = "tok-123";
    mutateAsync = jest.fn().mockResolvedValue(undefined);
    reset = jest.fn();
    mockedUseReset.mockReturnValue({
      mutateAsync,
      reset,
      isPending: false,
      error: null,
    } as never);
  });

  it("aplica token vindo do deep link no formulario", () => {
    const { result } = renderHook(() => useResetPasswordScreenController());
    expect(result.current.hasTokenFromLink).toBe(true);
    expect(result.current.form.getValues("token")).toBe("tok-123");
  });

  it("submete e marca status success em caso de sucesso", async () => {
    const { result } = renderHook(() => useResetPasswordScreenController());

    await act(async () => {
      result.current.form.setValue("password", "Senha!Forte01");
      result.current.form.setValue("confirmPassword", "Senha!Forte01");
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(mutateAsync).toHaveBeenCalledWith({
      token: "tok-123",
      password: "Senha!Forte01",
    });
    expect(result.current.status).toBe("success");
  });

  it("mantem status idle quando submissao falha", async () => {
    mutateAsync.mockRejectedValueOnce(
      new ApiError({ message: "expired", status: 400 }),
    );
    const { result } = renderHook(() => useResetPasswordScreenController());

    await act(async () => {
      result.current.form.setValue("password", "Senha!Forte01");
      result.current.form.setValue("confirmPassword", "Senha!Forte01");
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(result.current.status).toBe("idle");
  });

  it("redireciona para /login ao chamar handleBackToLogin", () => {
    const { result } = renderHook(() => useResetPasswordScreenController());
    act(() => {
      result.current.handleBackToLogin();
    });
    expect(mockReplace).toHaveBeenCalledWith("/login");
  });

  it("hasTokenFromLink false quando deep link nao traz token", () => {
    mockTokenParam = undefined;
    const { result } = renderHook(() => useResetPasswordScreenController());
    expect(result.current.hasTokenFromLink).toBe(false);
  });

  it("dismissSubmitError reseta a mutation", () => {
    const { result } = renderHook(() => useResetPasswordScreenController());
    act(() => {
      result.current.dismissSubmitError();
    });
    expect(reset).toHaveBeenCalled();
  });
});
