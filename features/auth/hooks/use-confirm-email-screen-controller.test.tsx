import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import type { PropsWithChildren, ReactElement } from "react";

import { useConfirmEmailScreenController } from "@/features/auth/hooks/use-confirm-email-screen-controller";

const mockReplaceFn = jest.fn();
let mockedSearchParams: Record<string, string> = {};
const mockMutate = jest.fn();
let mockMutationState: {
  data: { message: string } | null;
  error: unknown | null;
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
} = {
  data: null,
  error: null,
  isPending: false,
  isSuccess: false,
  isError: false,
};

jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: mockReplaceFn,
    back: jest.fn(),
    canGoBack: jest.fn(() => true),
  }),
  useLocalSearchParams: () => mockedSearchParams,
}));

jest.mock("@/features/auth/hooks/use-auth-mutations", () => ({
  useConfirmEmailMutation: () => ({
    mutate: mockMutate,
    data: mockMutationState.data,
    error: mockMutationState.error,
    isPending: mockMutationState.isPending,
    isSuccess: mockMutationState.isSuccess,
    isError: mockMutationState.isError,
  }),
}));

const buildWrapper = (
  client: QueryClient,
): ((props: PropsWithChildren) => ReactElement) =>
  function Wrapper({ children }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };

const buildClient = (): QueryClient =>
  new QueryClient({ defaultOptions: { queries: { retry: false } } });

const resetMutationState = (): void => {
  mockMutationState = {
    data: null,
    error: null,
    isPending: false,
    isSuccess: false,
    isError: false,
  };
};

describe("useConfirmEmailScreenController", () => {
  beforeEach(() => {
    mockReplaceFn.mockReset();
    mockMutate.mockReset();
    mockedSearchParams = {};
    resetMutationState();
  });

  it("returns 'no-token' when the URL has no token query", () => {
    const { result } = renderHook(() => useConfirmEmailScreenController(), {
      wrapper: buildWrapper(buildClient()),
    });
    expect(result.current.status).toBe("no-token");
    expect(result.current.hasToken).toBe(false);
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it("auto-fires confirmEmail when a token is present", async () => {
    mockedSearchParams = { token: "abc-123" };
    renderHook(() => useConfirmEmailScreenController(), {
      wrapper: buildWrapper(buildClient()),
    });
    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith({ token: "abc-123" });
    });
  });

  it("does not fire twice across renders", async () => {
    mockedSearchParams = { token: "stable-token" };
    const { rerender } = renderHook(
      () => useConfirmEmailScreenController(),
      { wrapper: buildWrapper(buildClient()) },
    );
    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledTimes(1);
    });
    rerender({});
    rerender({});
    expect(mockMutate).toHaveBeenCalledTimes(1);
  });

  it("ignores empty token strings", () => {
    mockedSearchParams = { token: "  " };
    const { result } = renderHook(() => useConfirmEmailScreenController(), {
      wrapper: buildWrapper(buildClient()),
    });
    expect(result.current.status).toBe("no-token");
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it("reflects pending state from the mutation", () => {
    mockedSearchParams = { token: "abc" };
    mockMutationState.isPending = true;
    const { result } = renderHook(() => useConfirmEmailScreenController(), {
      wrapper: buildWrapper(buildClient()),
    });
    expect(result.current.status).toBe("pending");
  });

  it("reflects success state and message from the mutation", () => {
    mockedSearchParams = { token: "abc" };
    mockMutationState.isSuccess = true;
    mockMutationState.data = { message: "Conta confirmada" };
    const { result } = renderHook(() => useConfirmEmailScreenController(), {
      wrapper: buildWrapper(buildClient()),
    });
    expect(result.current.status).toBe("success");
    expect(result.current.message).toBe("Conta confirmada");
  });

  it("reflects error state from the mutation", () => {
    mockedSearchParams = { token: "abc" };
    mockMutationState.isError = true;
    mockMutationState.error = new Error("expired");
    const { result } = renderHook(() => useConfirmEmailScreenController(), {
      wrapper: buildWrapper(buildClient()),
    });
    expect(result.current.status).toBe("error");
    expect(result.current.error).toBeInstanceOf(Error);
  });

  it("handleGoToDashboard replaces with /dashboard", () => {
    const { result } = renderHook(() => useConfirmEmailScreenController(), {
      wrapper: buildWrapper(buildClient()),
    });
    act(() => {
      result.current.handleGoToDashboard();
    });
    expect(mockReplaceFn).toHaveBeenCalledWith("/dashboard");
  });

  it("handleGoToLogin replaces with /login", () => {
    const { result } = renderHook(() => useConfirmEmailScreenController(), {
      wrapper: buildWrapper(buildClient()),
    });
    act(() => {
      result.current.handleGoToLogin();
    });
    expect(mockReplaceFn).toHaveBeenCalledWith("/login");
  });

  it("handleResendConfirmation replaces with /resend-confirmation", () => {
    const { result } = renderHook(() => useConfirmEmailScreenController(), {
      wrapper: buildWrapper(buildClient()),
    });
    act(() => {
      result.current.handleResendConfirmation();
    });
    expect(mockReplaceFn).toHaveBeenCalledWith("/resend-confirmation");
  });
});
