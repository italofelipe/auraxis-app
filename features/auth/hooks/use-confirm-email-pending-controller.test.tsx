import { act, renderHook } from "@testing-library/react-native";

import { ApiError } from "@/core/http/api-error";
import { useResendConfirmationMutation } from "@/features/auth/hooks/use-auth-mutations";
import { useConfirmEmailPendingController } from "@/features/auth/hooks/use-confirm-email-pending-controller";
import { useSessionStore } from "@/core/session/session-store";

const mockReplace = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: mockReplace,
    back: jest.fn(),
    canGoBack: jest.fn(() => false),
  }),
}));

jest.mock("@/core/session/session-store", () => ({
  useSessionStore: jest.fn(),
}));

jest.mock("@/features/auth/hooks/use-auth-mutations", () => ({
  useResendConfirmationMutation: jest.fn(),
}));

const mockedUseResend = jest.mocked(useResendConfirmationMutation);
const mockedUseSessionStore = jest.mocked(useSessionStore);

describe("useConfirmEmailPendingController", () => {
  let mutateAsync: jest.Mock;
  let reset: jest.Mock;

  beforeEach(() => {
    mockReplace.mockReset();
    mutateAsync = jest.fn().mockResolvedValue(undefined);
    reset = jest.fn();
    mockedUseResend.mockReturnValue({
      mutateAsync,
      reset,
      isPending: false,
      error: null,
    } as never);
    mockedUseSessionStore.mockImplementation(
      ((selector: (state: { userEmail: string | null }) => unknown) =>
        selector({ userEmail: "italo@auraxis.com" })) as never,
    );
  });

  it("expoe email mascarado a partir do session store", () => {
    const { result } = renderHook(() => useConfirmEmailPendingController());
    expect(result.current.maskedEmail).toBe("it***@auraxis.com");
  });

  it("marca resendSucceeded apos resend bem sucedido", async () => {
    const { result } = renderHook(() => useConfirmEmailPendingController());

    await act(async () => {
      await result.current.handleResend();
    });

    expect(mutateAsync).toHaveBeenCalled();
    expect(result.current.resendSucceeded).toBe(true);
  });

  it("nao marca sucesso quando resend falha", async () => {
    mutateAsync.mockRejectedValueOnce(new ApiError({ message: "fail", status: 500 }));
    const { result } = renderHook(() => useConfirmEmailPendingController());

    await act(async () => {
      await result.current.handleResend();
    });

    expect(result.current.resendSucceeded).toBe(false);
  });

  it("redireciona para /dashboard ao chamar handleSkip", () => {
    const { result } = renderHook(() => useConfirmEmailPendingController());
    act(() => {
      result.current.handleSkip();
    });
    expect(mockReplace).toHaveBeenCalledWith("/dashboard");
  });

  it("dismissResendError reseta mutation e flag de sucesso", () => {
    const { result } = renderHook(() => useConfirmEmailPendingController());
    act(() => {
      result.current.dismissResendError();
    });
    expect(reset).toHaveBeenCalled();
    expect(result.current.resendSucceeded).toBe(false);
  });
});
