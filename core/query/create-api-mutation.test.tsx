import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react-native";

import { ApiError } from "@/core/http/api-error";
import { useApiMutation } from "@/core/query/create-api-mutation";
import { triggerHapticNotification } from "@/shared/feedback/haptics";

jest.mock("@/shared/feedback/haptics", () => ({
  triggerHapticNotification: jest.fn(),
}));

const triggerHapticNotificationMock =
  triggerHapticNotification as jest.MockedFunction<
    typeof triggerHapticNotification
  >;

const buildWrapper = () => {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return function Wrapper({ children }: { readonly children: React.ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
};

describe("useApiMutation", () => {
  beforeEach(() => {
    triggerHapticNotificationMock.mockClear();
  });

  it("dispara haptic success ao concluir mutation com sucesso", async () => {
    const fn = jest.fn().mockResolvedValue({ ok: true });

    const { result } = renderHook(() => useApiMutation(fn), {
      wrapper: buildWrapper(),
    });

    result.current.mutate({});

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(triggerHapticNotificationMock).toHaveBeenCalledWith("success");
  });

  it("dispara haptic error ao falhar a mutation", async () => {
    const fn = jest
      .fn()
      .mockRejectedValue(
        new ApiError({
          message: "boom",
          status: 500,
          code: "internal_error",
        }),
      );

    const { result } = renderHook(() => useApiMutation(fn), {
      wrapper: buildWrapper(),
    });

    result.current.mutate({});

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(triggerHapticNotificationMock).toHaveBeenCalledWith("error");
  });

  it("respeita suppressHaptics: true", async () => {
    const fn = jest.fn().mockResolvedValue({ ok: true });

    const { result } = renderHook(
      () => useApiMutation(fn, { suppressHaptics: true }),
      { wrapper: buildWrapper() },
    );

    result.current.mutate({});

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(triggerHapticNotificationMock).not.toHaveBeenCalled();
  });

  it("preserva onSuccess do caller", async () => {
    const fn = jest.fn().mockResolvedValue({ ok: true });
    const onSuccess = jest.fn();

    const { result } = renderHook(() => useApiMutation(fn, { onSuccess }), {
      wrapper: buildWrapper(),
    });

    result.current.mutate({});

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(triggerHapticNotificationMock).toHaveBeenCalledWith("success");
  });

  it("preserva onError do caller", async () => {
    const fn = jest
      .fn()
      .mockRejectedValue(
        new ApiError({
          message: "boom",
          status: 500,
          code: "internal_error",
        }),
      );
    const onError = jest.fn();

    const { result } = renderHook(() => useApiMutation(fn, { onError }), {
      wrapper: buildWrapper(),
    });

    result.current.mutate({});

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(onError).toHaveBeenCalledTimes(1);
    expect(triggerHapticNotificationMock).toHaveBeenCalledWith("error");
  });
});
