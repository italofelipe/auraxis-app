import { render } from "@testing-library/react-native";

import { AppProviders } from "@/core/providers/app-providers";
import { RegisterScreen } from "@/features/auth/screens/register-screen";

const mockController = {
  form: {
    control: {} as never,
    formState: { errors: {} },
    handleSubmit: jest.fn(),
    setValue: jest.fn(),
    setError: jest.fn(),
    reset: jest.fn(),
    register: jest.fn(),
    watch: jest.fn(() => ""),
  },
  password: "",
  isSubmitting: false,
  submitError: null,
  handleSubmit: jest.fn(),
  dismissSubmitError: jest.fn(),
  handleBackToLogin: jest.fn(),
  handleOpenTerms: jest.fn(),
  handleOpenPrivacy: jest.fn(),
};

jest.mock("@/features/auth/hooks/use-register-screen-controller", () => ({
  useRegisterScreenController: jest.fn(),
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

import { useRegisterScreenController } from "@/features/auth/hooks/use-register-screen-controller";

const mockedUseController = jest.mocked(useRegisterScreenController);

describe("RegisterScreen", () => {
  beforeEach(() => {
    mockedUseController.mockReturnValue(mockController as never);
  });

  it("renderiza titulo e botao principal", () => {
    const { getAllByText, getByText } = render(
      <AppProviders>
        <RegisterScreen />
      </AppProviders>,
    );

    expect(getAllByText("Criar conta").length).toBeGreaterThan(0);
    expect(getByText("Termos de Uso")).toBeTruthy();
  });

  it("desabilita o botao de submit quando submitting", () => {
    mockedUseController.mockReturnValue({
      ...mockController,
      isSubmitting: true,
    } as never);

    const { getByText } = render(
      <AppProviders>
        <RegisterScreen />
      </AppProviders>,
    );

    expect(getByText("Criando...")).toBeTruthy();
  });
});
