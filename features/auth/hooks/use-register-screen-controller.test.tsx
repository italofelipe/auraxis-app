import { act, renderHook, waitFor } from "@testing-library/react-native";

import { ApiError } from "@/core/http/api-error";
import {
  useLoginMutation,
  useRegisterMutation,
} from "@/features/auth/hooks/use-auth-mutations";
import {
  useRegisterScreenController,
  type RegisterScreenController,
} from "@/features/auth/hooks/use-register-screen-controller";

const mockReplace = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: mockReplace,
    back: jest.fn(),
    canGoBack: jest.fn(() => false),
  }),
  usePathname: jest.fn(() => "/register"),
  useLocalSearchParams: jest.fn(() => ({})),
}));

jest.mock("@/features/auth/hooks/use-auth-mutations", () => ({
  useRegisterMutation: jest.fn(),
  useLoginMutation: jest.fn(),
}));

const mockedUseRegisterMutation = jest.mocked(useRegisterMutation);
const mockedUseLoginMutation = jest.mocked(useLoginMutation);

const validValues = {
  name: "Italo Chagas",
  email: "user@auraxis.com",
  password: "Senha!Forte01",
  confirmPassword: "Senha!Forte01",
};

interface MutationStub {
  mutateAsync: jest.Mock;
  reset: jest.Mock;
  isPending: boolean;
  error: unknown;
}

const buildMutationStub = (override: Partial<MutationStub> = {}): MutationStub => ({
  mutateAsync: jest.fn().mockResolvedValue(undefined),
  reset: jest.fn(),
  isPending: false,
  error: null,
  ...override,
});

const fillValidForm = async (controller: RegisterScreenController) => {
  await act(async () => {
    controller.form.setValue("name", validValues.name);
    controller.form.setValue("email", validValues.email);
    controller.form.setValue("password", validValues.password);
    controller.form.setValue("confirmPassword", validValues.confirmPassword);
  });
};

describe("useRegisterScreenController", () => {
  let registerStub: MutationStub;
  let loginStub: MutationStub;

  beforeEach(() => {
    mockReplace.mockReset();
    registerStub = buildMutationStub();
    loginStub = buildMutationStub();
    mockedUseRegisterMutation.mockReturnValue(registerStub as never);
    mockedUseLoginMutation.mockReturnValue(loginStub as never);
  });

  it("submete cadastro, faz auto-login e redireciona para confirm-email-pending", async () => {
    const { result } = renderHook(() => useRegisterScreenController());
    await fillValidForm(result.current);

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(registerStub.mutateAsync).toHaveBeenCalledWith({
      name: validValues.name,
      email: validValues.email,
      password: validValues.password,
    });
    expect(loginStub.mutateAsync).toHaveBeenCalledWith({
      email: validValues.email,
      password: validValues.password,
    });
    expect(mockReplace).toHaveBeenCalledWith("/confirm-email-pending");
  });

  it("redireciona para /login se o auto-login falhar mas o cadastro tiver concluido", async () => {
    loginStub.mutateAsync.mockRejectedValueOnce(
      new ApiError({ message: "login required", status: 401 }),
    );

    const { result } = renderHook(() => useRegisterScreenController());
    await fillValidForm(result.current);

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(registerStub.mutateAsync).toHaveBeenCalled();
    expect(mockReplace).toHaveBeenCalledWith("/login");
  });

  it("aplica erros de campo retornados pela API quando o cadastro falha", async () => {
    registerStub.mutateAsync.mockRejectedValueOnce(
      new ApiError({
        message: "validation",
        status: 400,
        details: { email: "Email ja cadastrado" },
      }),
    );

    const setErrorSpy = jest.fn();
    const { result } = renderHook(() => useRegisterScreenController());
    result.current.form.setError = setErrorSpy as never;
    await fillValidForm(result.current);

    await act(async () => {
      await result.current.handleSubmit();
    });

    await waitFor(() => {
      expect(setErrorSpy).toHaveBeenCalledWith(
        "email",
        expect.objectContaining({ message: "Email ja cadastrado", type: "server" }),
      );
    });
    expect(loginStub.mutateAsync).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
    expect(result.current.submitError).toBeInstanceOf(ApiError);
  });

  it("expoe isSubmitting true quando qualquer mutation estiver pendente", () => {
    registerStub.isPending = true;
    const { result } = renderHook(() => useRegisterScreenController());
    expect(result.current.isSubmitting).toBe(true);
  });

  it("limpa o submitError ao chamar dismissSubmitError", async () => {
    registerStub.mutateAsync.mockRejectedValueOnce(
      new ApiError({ message: "oops", status: 400 }),
    );

    const { result } = renderHook(() => useRegisterScreenController());
    await fillValidForm(result.current);

    await act(async () => {
      await result.current.handleSubmit();
    });
    expect(result.current.submitError).toBeInstanceOf(ApiError);

    act(() => {
      result.current.dismissSubmitError();
    });

    expect(result.current.submitError).toBeNull();
    expect(registerStub.reset).toHaveBeenCalled();
  });

  it("redireciona para /login ao chamar handleBackToLogin", () => {
    const { result } = renderHook(() => useRegisterScreenController());
    act(() => {
      result.current.handleBackToLogin();
    });
    expect(mockReplace).toHaveBeenCalledWith("/login");
  });

  it("usa openUrl injetado para abrir Termos e Privacidade", async () => {
    const openUrl = jest.fn().mockResolvedValue(true);
    const { result } = renderHook(() =>
      useRegisterScreenController({ openUrl }),
    );

    await act(async () => {
      await result.current.handleOpenTerms();
    });
    await act(async () => {
      await result.current.handleOpenPrivacy();
    });

    expect(openUrl).toHaveBeenCalledTimes(2);
  });
});
