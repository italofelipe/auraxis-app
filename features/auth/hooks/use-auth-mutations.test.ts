import {
  useLoginMutation,
  useLogoutMutation,
  useRegisterMutation,
} from "@/features/auth/hooks/use-auth-mutations";
import type { AnalyticsClient } from "@/core/observability/analytics-types";
import type { AuthSession } from "@/features/auth/contracts";
import { authService } from "@/features/auth/services/auth-service";
import { useSessionStore } from "@/core/session/session-store";

const mockCreateApiMutation = jest.fn();
const mockAnalyticsClient: jest.Mocked<AnalyticsClient> = {
  capture: jest.fn(),
  identify: jest.fn(),
  screen: jest.fn(),
  reset: jest.fn(),
};

jest.mock("@/core/query/create-api-mutation", () => ({
  createApiMutation: (...args: readonly unknown[]) => mockCreateApiMutation(...args),
}));

jest.mock("@/core/observability/use-analytics", () => ({
  useAnalytics: () => mockAnalyticsClient,
}));

jest.mock("@/core/session/session-store", () => ({
  useSessionStore: jest.fn(),
}));

jest.mock("@/features/auth/services/auth-service", () => ({
  authService: {
    login: jest.fn(),
    logout: jest.fn(),
    register: jest.fn(),
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

  it("identifica usuario e captura login sem enviar email bruto", async () => {
    const signIn = jest.fn().mockResolvedValue(undefined);
    mockedUseSessionStore.mockReturnValue(signIn as never);
    const session: AuthSession = {
      accessToken: "access-token",
      refreshToken: "refresh-token",
      user: {
        id: "user-123",
        name: "Person",
        email: "person@example.com",
        emailConfirmed: true,
      },
    };

    const mutation = useLoginMutation() as unknown as {
      onSuccess: (session: AuthSession) => Promise<void>;
    };

    await mutation.onSuccess(session);

    expect(signIn).toHaveBeenCalledWith({
      accessToken: "access-token",
      refreshToken: "refresh-token",
      user: {
        id: "user-123",
        name: "Person",
        email: "person@example.com",
        emailConfirmed: true,
      },
    });
    expect(mockAnalyticsClient.identify).toHaveBeenCalledWith("user-123", {
      emailConfirmed: true,
    });
    expect(mockAnalyticsClient.capture).toHaveBeenCalledWith(
      "auth.login.success",
      {
        method: "password",
        emailConfirmed: true,
      },
    );
    expect(JSON.stringify(mockAnalyticsClient.capture.mock.calls)).not.toContain(
      "person@example.com",
    );
    expect(JSON.stringify(mockAnalyticsClient.identify.mock.calls)).not.toContain(
      "person@example.com",
    );
  });

  it("captura cadastro concluido sem enviar email bruto", async () => {
    const mutation = useRegisterMutation() as unknown as {
      onSuccess: (
        data: unknown,
        variables: {
          readonly name: string;
          readonly email: string;
          readonly password: string;
        },
      ) => void;
    };

    mutation.onSuccess(
      { accepted: true, message: "ok" },
      {
        name: "Person",
        email: "person@example.com",
        password: "secret-password",
      },
    );

    expect(mockAnalyticsClient.capture).toHaveBeenCalledWith(
      "auth.register.completed",
      {
        emailConfirmed: false,
      },
    );
    expect(JSON.stringify(mockAnalyticsClient.capture.mock.calls)).not.toContain(
      "person@example.com",
    );
    expect(JSON.stringify(mockAnalyticsClient.capture.mock.calls)).not.toContain(
      "secret-password",
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

    expect(mockAnalyticsClient.capture).toHaveBeenCalledWith("auth.logout", {
      reason: "manual",
    });
    expect(mockAnalyticsClient.reset).toHaveBeenCalledTimes(1);
    expect(
      mockAnalyticsClient.capture.mock.invocationCallOrder[0],
    ).toBeLessThan(mockAnalyticsClient.reset.mock.invocationCallOrder[0] ?? 0);
    expect(signOut).toHaveBeenCalledTimes(1);
  });
});
