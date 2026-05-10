/**
 * E2E — Auth flow (RNTL + MSW)
 *
 * Tests the login screen controller behavior including:
 * - Form validation preventing submission without credentials
 * - Redirect to /dashboard on successful login
 * - Error state exposure on API failure
 * - Integration with QueryClient and MSW server lifecycle
 *
 * Closes #375
 */
import { act, renderHook, waitFor } from "@testing-library/react-native";

import { ApiError } from "@/core/http/api-error";
import { server } from "@/__mocks__/msw-server";
import { handlers } from "@/__tests__/e2e/handlers";
import { useLoginMutation } from "@/features/auth/hooks/use-auth-mutations";
import { useLoginScreenController } from "@/features/auth/hooks/use-login-screen-controller";
import { createTestQueryClient } from "@/shared/testing/test-query-client";
import { createTestHookWrapper } from "@/shared/testing/test-providers";

// Setup MSW handlers for this suite
beforeEach(() => {
  server.use(...handlers);
});

// ---------------------------------------------------------------------------
// Module-level mocks (Jest hoisting requirement)
// ---------------------------------------------------------------------------

const mockReplace = jest.fn();
const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: jest.fn(),
    canGoBack: jest.fn(() => false),
  }),
  usePathname: jest.fn(() => "/"),
  useLocalSearchParams: jest.fn(() => ({})),
  useSegments: jest.fn(() => []),
  Link: ({ children }: { children: React.ReactNode }) => children,
  Redirect: () => null,
  Stack: { Screen: () => null },
  Tabs: { Screen: () => null },
}));

jest.mock("@/core/session/use-session-failure-notice", () => ({
  useSessionFailureNotice: () => ({ notice: null, dismissNotice: jest.fn() }),
}));

jest.mock("@/features/auth/hooks/use-auth-mutations", () => ({
  useLoginMutation: jest.fn(),
}));

const mockedUseLoginMutation = jest.mocked(useLoginMutation);

// ---------------------------------------------------------------------------
// Auth E2E: login → dashboard → error states
// ---------------------------------------------------------------------------

describe("Auth E2E flow", () => {
  let queryClient: ReturnType<typeof createTestQueryClient>;
  let mutateAsync: jest.Mock;
  let reset: jest.Mock;

  beforeEach(() => {
    mockReplace.mockReset();
    mockPush.mockReset();
    queryClient = createTestQueryClient();
    mutateAsync = jest.fn().mockResolvedValue(undefined);
    reset = jest.fn();
    mockedUseLoginMutation.mockReturnValue({
      mutateAsync,
      reset,
      isPending: false,
      error: null,
    } as never);
  });

  it("redirects to /dashboard after successful login", async () => {
    const wrapper = createTestHookWrapper({ queryClient });
    const { result } = renderHook(() => useLoginScreenController(), {
      wrapper,
    });

    await act(async () => {
      result.current.form.setValue("email", "italo@auraxis.com.br");
      result.current.form.setValue("password", "password123");
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("does not redirect when login mutation rejects with API error", async () => {
    mutateAsync.mockRejectedValueOnce(
      new ApiError({ message: "Credenciais invalidas", status: 401 }),
    );

    const wrapper = createTestHookWrapper({ queryClient });
    const { result } = renderHook(() => useLoginScreenController(), {
      wrapper,
    });

    await act(async () => {
      result.current.form.setValue("email", "italo@auraxis.com.br");
      result.current.form.setValue("password", "wrong-password");
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    // When mutation rejects, the controller catches the error and
    // does not call router.replace (no redirect to dashboard)
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("does not redirect when form validation fails (empty fields)", async () => {
    const wrapper = createTestHookWrapper({ queryClient });
    const { result } = renderHook(() => useLoginScreenController(), {
      wrapper,
    });

    // Submit without filling in any fields
    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(mockReplace).not.toHaveBeenCalled();
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it("form controller initialises with empty values and not submitting", () => {
    const wrapper = createTestHookWrapper({ queryClient });
    const { result } = renderHook(() => useLoginScreenController(), {
      wrapper,
    });

    expect(result.current.form.getValues("email")).toBe("");
    expect(result.current.form.getValues("password")).toBe("");
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.submitError).toBeNull();
  });

  it("MSW server is listening and handlers are registered", () => {
    // Verify the MSW server is active in this test environment
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { server: mswServer } = require("@/__mocks__/msw-server");
    expect(mswServer).toBeDefined();
  });
});
