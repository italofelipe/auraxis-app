import { useLogoutMutation } from "@/features/auth/hooks/use-auth-mutations";
import { authService } from "@/features/auth/services/auth-service";
import { useSessionStore } from "@/core/session/session-store";

const mockCreateApiMutation = jest.fn();

jest.mock("@/core/query/create-api-mutation", () => ({
  createApiMutation: (...args: readonly unknown[]) => mockCreateApiMutation(...args),
}));

jest.mock("@/core/session/session-store", () => ({
  useSessionStore: jest.fn(),
}));

jest.mock("@/features/auth/services/auth-service", () => ({
  authService: {
    logout: jest.fn(),
  },
}));

const mockedUseSessionStore = jest.mocked(useSessionStore);
const mockedAuthService = authService as jest.Mocked<typeof authService>;

describe("useAuthMutations", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateApiMutation.mockImplementation(
      (mutationFn: unknown, options: Record<string, unknown> | undefined) => ({
        mutationFn,
        ...(options ?? {}),
      }),
    );
  });

  it("invalida a sessao local ao concluir logout", async () => {
    const signOut = jest.fn().mockResolvedValue(undefined);
    mockedUseSessionStore.mockReturnValue(signOut as never);

    const mutation = useLogoutMutation() as unknown as {
      onSettled: (...args: readonly unknown[]) => Promise<void>;
    };

    const [mutationFn, options] = mockCreateApiMutation.mock.calls[0] ?? [];
    expect(typeof mutationFn).toBe("function");
    expect(options).toEqual(
      expect.objectContaining({
        onSettled: expect.any(Function),
      }),
    );

    await (mutationFn as () => Promise<void>)();
    expect(mockedAuthService.logout).toHaveBeenCalledTimes(1);

    await mutation.onSettled(undefined, new Error("fail"), undefined, undefined);

    expect(signOut).toHaveBeenCalledTimes(1);
  });
});
