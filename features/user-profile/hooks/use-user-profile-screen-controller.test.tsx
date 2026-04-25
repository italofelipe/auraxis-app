import { act, renderHook } from "@testing-library/react-native";

import { useLogoutMutation } from "@/features/auth/hooks/use-auth-mutations";
import { useUpdateUserProfileMutation } from "@/features/user-profile/hooks/use-user-profile-mutations";
import { useUserProfileQuery } from "@/features/user-profile/hooks/use-user-profile-query";
import { useUserProfileScreenController } from "@/features/user-profile/hooks/use-user-profile-screen-controller";

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
  useLogoutMutation: jest.fn(),
}));

jest.mock("@/features/user-profile/hooks/use-user-profile-mutations", () => ({
  useUpdateUserProfileMutation: jest.fn(),
}));

jest.mock("@/features/user-profile/hooks/use-user-profile-query", () => ({
  useUserProfileQuery: jest.fn(),
}));

const mockedUseLogout = jest.mocked(useLogoutMutation);
const mockedUseUpdate = jest.mocked(useUpdateUserProfileMutation);
const mockedUseQuery = jest.mocked(useUserProfileQuery);

let updateStub: { mutateAsync: jest.Mock; reset: jest.Mock; isPending: boolean };
let logoutStub: { mutateAsync: jest.Mock; isPending: boolean };

beforeEach(() => {
  mockReplace.mockReset();
  updateStub = {
    mutateAsync: jest.fn().mockResolvedValue(undefined),
    reset: jest.fn(),
    isPending: false,
  };
  logoutStub = {
    mutateAsync: jest.fn().mockResolvedValue(undefined),
    isPending: false,
  };
  mockedUseUpdate.mockReturnValue(updateStub as never);
  mockedUseLogout.mockReturnValue(logoutStub as never);
  mockedUseQuery.mockReturnValue({ data: null } as never);
});

describe("useUserProfileScreenController", () => {
  it("inicia em mode read", () => {
    const { result } = renderHook(() => useUserProfileScreenController());
    expect(result.current.mode).toBe("read");
  });

  it("handleEdit alterna para edit", () => {
    const { result } = renderHook(() => useUserProfileScreenController());
    act(() => {
      result.current.handleEdit();
    });
    expect(result.current.mode).toBe("edit");
  });

  it("handleSubmit chama updateMutation e volta para read", async () => {
    const { result } = renderHook(() => useUserProfileScreenController());
    act(() => {
      result.current.handleEdit();
    });
    await act(async () => {
      await result.current.handleSubmit({ occupation: "Engenheira" });
    });
    expect(updateStub.mutateAsync).toHaveBeenCalledWith({ occupation: "Engenheira" });
    expect(result.current.mode).toBe("read");
  });

  it("captura submitError quando update falha e mantem mode edit", async () => {
    updateStub.mutateAsync.mockRejectedValueOnce(new Error("boom"));
    const { result } = renderHook(() => useUserProfileScreenController());
    act(() => {
      result.current.handleEdit();
    });
    await act(async () => {
      await result.current.handleSubmit({ occupation: "X" });
    });
    expect(result.current.submitError).toBeInstanceOf(Error);
    expect(result.current.mode).toBe("edit");
  });

  it("handleLogout chama logoutMutation e redireciona para login", async () => {
    const { result } = renderHook(() => useUserProfileScreenController());
    await act(async () => {
      await result.current.handleLogout();
    });
    expect(logoutStub.mutateAsync).toHaveBeenCalled();
    expect(mockReplace).toHaveBeenCalledWith("/login");
  });

  it("handleLogout redireciona mesmo se mutation falhar", async () => {
    logoutStub.mutateAsync.mockRejectedValueOnce(new Error("offline"));
    const { result } = renderHook(() => useUserProfileScreenController());
    await act(async () => {
      try {
        await result.current.handleLogout();
      } catch {
        /* swallow */
      }
    });
    expect(mockReplace).toHaveBeenCalledWith("/login");
  });

  it("dismissSubmitError limpa estado e reseta mutation", () => {
    const { result } = renderHook(() => useUserProfileScreenController());
    act(() => {
      result.current.dismissSubmitError();
    });
    expect(updateStub.reset).toHaveBeenCalled();
  });
});
