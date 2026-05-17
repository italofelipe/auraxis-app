import { fireEvent, render } from "@testing-library/react-native";

import {
  usePrivacyCenterScreenController,
  type PrivacyCenterScreenController,
} from "@/features/legal/hooks/use-privacy-center-screen-controller";
import { PrivacyCenterScreen } from "@/features/legal/screens/privacy-center-screen";
import { TestProviders } from "@/shared/testing/test-providers";

const baseController: PrivacyCenterScreenController = {
  exportRequestState: "idle",
  exportRequestError: null,
  handleOpenPrivacyPolicy: jest.fn(),
  handleOpenTermsOfService: jest.fn(),
  handleOpenCookiesInfo: jest.fn(),
  handleOpenDeleteAccount: jest.fn(),
  handleRequestDataExport: jest.fn().mockResolvedValue(undefined),
  dismissExportRequestFeedback: jest.fn(),
};

jest.mock("@/features/legal/hooks/use-privacy-center-screen-controller", () => ({
  usePrivacyCenterScreenController: jest.fn(),
}));

const mockedUseController = jest.mocked(usePrivacyCenterScreenController);

const renderScreen = (
  overrides: Partial<PrivacyCenterScreenController> = {},
): ReturnType<typeof render> => {
  mockedUseController.mockReturnValue({ ...baseController, ...overrides });
  return render(
    <TestProviders>
      <PrivacyCenterScreen />
    </TestProviders>,
  );
};

describe("PrivacyCenterScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders legal documents, cookies, export and delete account actions", () => {
    const { getByText } = renderScreen();

    expect(getByText("Central de privacidade")).toBeTruthy();
    expect(getByText("Politica de Privacidade")).toBeTruthy();
    expect(getByText("Termos de Uso")).toBeTruthy();
    expect(getByText("Cookies e analytics")).toBeTruthy();
    expect(getByText("Solicitar exportacao de dados")).toBeTruthy();
    expect(getByText("Excluir minha conta")).toBeTruthy();
  });

  it("forwards taps to controller actions", () => {
    const handleOpenPrivacyPolicy = jest.fn();
    const handleOpenTermsOfService = jest.fn();
    const handleOpenCookiesInfo = jest.fn();
    const handleRequestDataExport = jest.fn().mockResolvedValue(undefined);
    const handleOpenDeleteAccount = jest.fn();
    const { getByText } = renderScreen({
      handleOpenPrivacyPolicy,
      handleOpenTermsOfService,
      handleOpenCookiesInfo,
      handleRequestDataExport,
      handleOpenDeleteAccount,
    });

    fireEvent.press(getByText("Politica de Privacidade"));
    fireEvent.press(getByText("Termos de Uso"));
    fireEvent.press(getByText("Cookies e analytics"));
    fireEvent.press(getByText("Solicitar exportacao de dados"));
    fireEvent.press(getByText("Excluir minha conta"));

    expect(handleOpenPrivacyPolicy).toHaveBeenCalledTimes(1);
    expect(handleOpenTermsOfService).toHaveBeenCalledTimes(1);
    expect(handleOpenCookiesInfo).toHaveBeenCalledTimes(1);
    expect(handleRequestDataExport).toHaveBeenCalledTimes(1);
    expect(handleOpenDeleteAccount).toHaveBeenCalledTimes(1);
  });

  it("shows loading, success and error feedback for export requests", () => {
    const { getByText, rerender } = renderScreen({ exportRequestState: "loading" });
    expect(getByText("Abrindo canal seguro...")).toBeTruthy();

    mockedUseController.mockReturnValue({
      ...baseController,
      exportRequestState: "success",
    });
    rerender(
      <TestProviders>
        <PrivacyCenterScreen />
      </TestProviders>,
    );
    expect(getByText(/Seu app de email foi aberto/i)).toBeTruthy();

    mockedUseController.mockReturnValue({
      ...baseController,
      exportRequestState: "error",
      exportRequestError: new Error("mailto unavailable"),
    });
    rerender(
      <TestProviders>
        <PrivacyCenterScreen />
      </TestProviders>,
    );
    expect(getByText(/Nao foi possivel abrir a solicitacao/i)).toBeTruthy();
  });
});
