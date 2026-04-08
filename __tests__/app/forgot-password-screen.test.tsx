import { render, renderHook } from "@testing-library/react-native";
import { useForm } from "react-hook-form";

import ForgotPasswordScreen from "@/app/(public)/forgot-password";
import { AppProviders } from "@/core/providers/app-providers";
import {
  type ForgotPasswordFormValues,
} from "@/features/auth/validators";
import { useForgotPasswordScreenController } from "@/features/auth/hooks/use-forgot-password-screen-controller";

jest.mock("@/features/auth/hooks/use-forgot-password-screen-controller", () => ({
  useForgotPasswordScreenController: jest.fn(),
}));

const mockedUseForgotPasswordScreenController = jest.mocked(
  useForgotPasswordScreenController,
);

describe("ForgotPasswordScreen", () => {
  afterEach(() => {
    mockedUseForgotPasswordScreenController.mockReset();
  });

  it("renderiza a composicao canonica de recuperacao de senha", () => {
    const { result } = renderHook(() =>
      useForm<ForgotPasswordFormValues>({
        defaultValues: {
          email: "",
        },
      }),
    );

    mockedUseForgotPasswordScreenController.mockReturnValue({
      form: result.current,
      isSubmitting: false,
      handleSubmit: jest.fn().mockResolvedValue(undefined),
      handleBackToLogin: jest.fn(),
    });

    const { getByText } = render(
      <AppProviders>
        <ForgotPasswordScreen />
      </AppProviders>,
    );

    expect(getByText("Recuperar senha")).toBeTruthy();
    expect(getByText("Voltar para login")).toBeTruthy();
  });
});
