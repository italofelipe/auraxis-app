import { render, renderHook } from "@testing-library/react-native";
import { useForm } from "react-hook-form";

import LoginScreen from "@/app/(public)/login";
import { AppProviders } from "@/core/providers/app-providers";
import {
  type LoginFormValues,
} from "@/features/auth/validators";
import { useLoginScreenController } from "@/features/auth/hooks/use-login-screen-controller";

jest.mock("@/features/auth/hooks/use-login-screen-controller", () => ({
  useLoginScreenController: jest.fn(),
}));

const mockedUseLoginScreenController = jest.mocked(useLoginScreenController);

describe("LoginScreen", () => {
  afterEach(() => {
    mockedUseLoginScreenController.mockReset();
  });

  it("renderiza a tela de login usando a composicao canonica da feature", () => {
    const { result } = renderHook(() =>
      useForm<LoginFormValues>({
        defaultValues: {
          email: "",
          password: "",
        },
      }),
    );

    mockedUseLoginScreenController.mockReturnValue({
      form: result.current,
      isSubmitting: false,
      handleSubmit: jest.fn().mockResolvedValue(undefined),
      handleForgotPassword: jest.fn(),
      handleOpenTerms: jest.fn().mockResolvedValue(undefined),
      handleOpenPrivacy: jest.fn().mockResolvedValue(undefined),
    });

    const { getAllByText, getByText } = render(
      <AppProviders>
        <LoginScreen />
      </AppProviders>,
    );

    expect(getAllByText("Entrar").length).toBeGreaterThan(0);
    expect(getByText("Esqueceu sua senha?")).toBeTruthy();
    expect(getByText("Termos de Uso")).toBeTruthy();
  });
});
