import { fireEvent, render } from "@testing-library/react-native";
import { StyleSheet } from "react-native";

import { ApiError } from "@/core/http/api-error";
import { LoginScreen } from "@/features/auth/screens/login-screen";
import { TestProviders } from "@/shared/testing/test-providers";
import { useLoginScreenController } from "@/features/auth/hooks/use-login-screen-controller";
import { initI18n, switchLocale } from "@/shared/i18n";

const mockController = {
  form: {
    control: {} as never,
    formState: { errors: {} },
  },
  isSubmitting: false,
  submitError: null,
  sessionFailureNotice: null,
  captcha: { required: false, token: null, missingChallenge: false },
  handleCaptchaToken: jest.fn(),
  handleCaptchaExpired: jest.fn(),
  handleSubmit: jest.fn(),
  dismissSubmitError: jest.fn(),
  handleForgotPassword: jest.fn(),
  handleRegister: jest.fn(),
  handleOpenTerms: jest.fn(),
  handleOpenPrivacy: jest.fn(),
  dismissSessionFailureNotice: jest.fn(),
};

jest.mock("@/features/auth/hooks/use-login-screen-controller", () => ({
  useLoginScreenController: jest.fn(),
}));

jest.mock("@expo/vector-icons", () => ({
  MaterialCommunityIcons: "MaterialCommunityIcons",
}));

jest.mock("react-hook-form", () => {
  const actual = jest.requireActual("react-hook-form");
  return {
    ...actual,
    Controller: ({
      render: renderProp,
    }: {
      render: (args: { field: { onChange: () => void; onBlur: () => void; value: string } }) => unknown;
    }) =>
      renderProp({
        field: { onChange: () => undefined, onBlur: () => undefined, value: "" },
      }) as never,
  };
});

const mockedUseController = jest.mocked(useLoginScreenController);

const renderScreen = (): ReturnType<typeof render> =>
  render(
    <TestProviders>
      <LoginScreen />
    </TestProviders>,
  );

describe("LoginScreen", () => {
  beforeAll(async () => {
    await initI18n("pt");
  });

  beforeEach(async () => {
    await switchLocale("pt");
    jest.clearAllMocks();
    mockedUseController.mockReturnValue(mockController as never);
  });

  it("renderiza a superficie premium B3 preservando o formulario de login", () => {
    const { getByTestId, getByText, getByLabelText } = renderScreen();

    expect(getByTestId("login-premium-screen")).toBeTruthy();
    expect(getByText("Auraxis")).toBeTruthy();
    expect(getByText("ACESSO SEGURO E PROTEGIDO")).toBeTruthy();
    expect(getByText("Organize suas finanças com")).toBeTruthy();
    expect(getByText("clareza.")).toBeTruthy();
    expect(getByLabelText("E-MAIL")).toBeTruthy();
    expect(getByLabelText("SENHA")).toBeTruthy();
    expect(getByText("Entrar na Auraxis")).toBeTruthy();
    expect(getByText("OU")).toBeTruthy();
    expect(getByText("Termos de Uso")).toBeTruthy();
    expect(getByText("Privacidade")).toBeTruthy();
  });

  it("renderiza placeholders premium pelo idioma ativo", async () => {
    await switchLocale("en");

    const { getByPlaceholderText } = renderScreen();

    expect(getByPlaceholderText("you@example.com")).toBeTruthy();
    expect(getByPlaceholderText("Your password")).toBeTruthy();
  });

  it("aplica halo premium no proprio input enquanto focado", () => {
    // #655: the focus halo lives on the Input itself, not on a wrapping shell.
    // Nesting the Input inside a styled shell swallowed tap-to-focus on device;
    // asserting the style on the input guards against reintroducing the wrapper.
    const { getByPlaceholderText } = renderScreen();
    const emailInput = getByPlaceholderText("seu@email.com");

    fireEvent(emailInput, "focus");
    expect(StyleSheet.flatten(emailInput.props.style)).toEqual(
      expect.objectContaining({
        borderColor: "rgba(155,233,255,0.6)",
      }),
    );

    fireEvent(emailInput, "blur");
    expect(StyleSheet.flatten(emailInput.props.style)).toEqual(
      expect.objectContaining({
        borderColor: "rgba(255,255,255,0.16)",
      }),
    );
  });

  it("estiliza a borda glass no proprio input (regressao #655)", () => {
    // The glass border/background must live on the Input itself. If a styled
    // shell wraps a transparent Input again — the layout that swallowed
    // tap-to-focus — the border would move off the input and this fails.
    const { getByPlaceholderText } = renderScreen();
    const emailInput = getByPlaceholderText("seu@email.com");

    expect(StyleSheet.flatten(emailInput.props.style)).toEqual(
      expect.objectContaining({ borderColor: "rgba(255,255,255,0.16)" }),
    );
  });

  it("mantem as acoes do fluxo de auth conectadas ao controller", () => {
    const { getByText } = renderScreen();

    fireEvent.press(getByText("Entrar na Auraxis"));
    fireEvent.press(getByText("Esqueceu sua senha?"));
    fireEvent.press(getByText("Criar conta gratuita"));
    fireEvent.press(getByText("Termos de Uso"));
    fireEvent.press(getByText("Privacidade"));

    expect(mockController.handleSubmit).toHaveBeenCalledTimes(1);
    expect(mockController.handleForgotPassword).toHaveBeenCalledTimes(1);
    expect(mockController.handleRegister).toHaveBeenCalledTimes(1);
    expect(mockController.handleOpenTerms).toHaveBeenCalledTimes(1);
    expect(mockController.handleOpenPrivacy).toHaveBeenCalledTimes(1);
  });

  it("mantem a senha mascarada por padrao e alterna a visibilidade", () => {
    const { getByLabelText } = renderScreen();
    const passwordInput = getByLabelText("SENHA");

    expect(passwordInput.props.secureTextEntry).toBe(true);

    fireEvent.press(getByLabelText("Mostrar senha"));
    expect(getByLabelText("SENHA").props.secureTextEntry).toBe(false);

    fireEvent.press(getByLabelText("Ocultar senha"));
    expect(getByLabelText("SENHA").props.secureTextEntry).toBe(true);
  });

  it("diferencia falha de rede de credenciais invalidas", () => {
    mockedUseController.mockReturnValue({
      ...mockController,
      submitError: new ApiError({
        message: "Network Error",
        status: 0,
      }),
    } as never);

    const { getByText, queryByText } = renderScreen();

    expect(getByText("Verifique sua internet e tente novamente.")).toBeTruthy();
    expect(queryByText("Confira seus dados e tente novamente.")).toBeNull();
  });

  it("normaliza a mensagem de credenciais invalidas sem expor a API", () => {
    mockedUseController.mockReturnValue({
      ...mockController,
      submitError: new ApiError({
        message: "E-mail ou senha invalidos.",
        status: 401,
        code: "INVALID_CREDENTIALS",
      }),
    } as never);

    const { getByText, queryByText } = renderScreen();

    expect(getByText("E-mail ou senha inválidos.")).toBeTruthy();
    expect(queryByText("Confira seus dados e tente novamente.")).toBeNull();
  });

  it("renderiza sessao expirada em vidro e permite fechar", () => {
    mockedUseController.mockReturnValue({
      ...mockController,
      sessionFailureNotice: {
        title: "Sua sessão expirou",
        description: "Entre novamente para continuar com segurança.",
        dismissLabel: "Fechar",
      },
    } as never);

    const { getByText } = renderScreen();

    expect(getByText("Sua sessão expirou")).toBeTruthy();
    expect(getByText("Entre novamente para continuar com segurança.")).toBeTruthy();
    fireEvent.press(getByText("Fechar"));
    expect(mockController.dismissSessionFailureNotice).toHaveBeenCalledTimes(1);
  });
});
