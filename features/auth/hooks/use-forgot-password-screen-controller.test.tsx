import { act, renderHook } from "@testing-library/react-native";

import { ApiError } from "@/core/http/api-error";
import { useForgotPasswordMutation } from "@/features/auth/hooks/use-auth-mutations";
import { useForgotPasswordScreenController } from "@/features/auth/hooks/use-forgot-password-screen-controller";

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
  useForgotPasswordMutation: jest.fn(),
}));

const mockedUseForgot = jest.mocked(useForgotPasswordMutation);

describe("useForgotPasswordScreenController", () => {
  let mutateAsync: jest.Mock;
  let reset: jest.Mock;

  beforeEach(() => {
    mockReplace.mockReset();
    mutateAsync = jest.fn().mockResolvedValue(undefined);
    reset = jest.fn();
    mockedUseForgot.mockReturnValue({
      mutateAsync,
      reset,
      isPending: false,
      error: null,
    } as never);
  });

  it("muda status para success ao concluir submissao", async () => {
    const { result } = renderHook(() => useForgotPasswordScreenController());
    await act(async () => {
      result.current.form.setValue("email", "user@auraxis.com");
    });
    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(mutateAsync).toHaveBeenCalledWith({ email: "user@auraxis.com" });
    expect(result.current.status).toBe("success");
  });

  it("mantem status idle e captura o erro na mutation quando submissao falha", async () => {
    mutateAsync.mockRejectedValueOnce(new ApiError({ message: "fail", status: 500 }));
    const { result } = renderHook(() => useForgotPasswordScreenController());
    await act(async () => {
      result.current.form.setValue("email", "user@auraxis.com");
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(mutateAsync).toHaveBeenCalled();
    expect(result.current.status).toBe("idle");
  });

  it("redireciona para /login ao chamar handleBackToLogin", () => {
    const { result } = renderHook(() => useForgotPasswordScreenController());
    act(() => {
      result.current.handleBackToLogin();
    });
    expect(mockReplace).toHaveBeenCalledWith("/login");
  });

  it("handleResubmit reseta mutation e volta para idle", async () => {
    const { result } = renderHook(() => useForgotPasswordScreenController());
    await act(async () => {
      result.current.form.setValue("email", "user@auraxis.com");
    });
    await act(async () => {
      await result.current.handleSubmit();
    });
    expect(result.current.status).toBe("success");

    act(() => {
      result.current.handleResubmit();
    });

    expect(reset).toHaveBeenCalled();
    expect(result.current.status).toBe("idle");
  });

  it("dismissSubmitError chama reset da mutation", () => {
    const { result } = renderHook(() => useForgotPasswordScreenController());
    act(() => {
      result.current.dismissSubmitError();
    });
    expect(reset).toHaveBeenCalled();
  });
});
