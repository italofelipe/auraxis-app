import { act, renderHook, waitFor } from "@testing-library/react-native";

import {
  useLoginMutation,
  useRegisterMutation,
} from "@/features/auth/hooks/use-auth-mutations";
import { useRegisterScreenController } from "@/features/auth/hooks/use-register-screen-controller";

jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    canGoBack: jest.fn(() => false),
  }),
}));

jest.mock("@/features/auth/hooks/use-auth-mutations", () => ({
  useRegisterMutation: jest.fn(),
  useLoginMutation: jest.fn(),
}));

const mockedUseRegister = jest.mocked(useRegisterMutation);
const mockedUseLogin = jest.mocked(useLoginMutation);

const buildStub = () =>
  ({
    mutateAsync: jest.fn().mockResolvedValue(undefined),
    reset: jest.fn(),
    isPending: false,
    error: null,
  }) as never;

describe("useRegisterScreenController cross-field revalidation", () => {
  beforeEach(() => {
    mockedUseRegister.mockReturnValue(buildStub());
    mockedUseLogin.mockReturnValue(buildStub());
  });

  it("re-aplica erro de confirmPassword quando senha muda apos confirmacao tocada", async () => {
    const { result } = renderHook(() => useRegisterScreenController());

    await act(async () => {
      result.current.form.setValue("password", "Senha!Forte01");
      result.current.form.setValue("confirmPassword", "Senha!Forte01", {
        shouldTouch: true,
      });
    });
    await act(async () => {
      await result.current.form.trigger("confirmPassword");
    });

    expect(result.current.form.formState.errors.confirmPassword).toBeUndefined();

    await act(async () => {
      result.current.form.setValue("password", "Outra!Senha02", {
        shouldDirty: true,
        shouldTouch: true,
      });
    });

    await waitFor(() => {
      expect(result.current.form.formState.errors.confirmPassword?.message).toBe(
        "As senhas precisam ser iguais.",
      );
    });
  });
});
