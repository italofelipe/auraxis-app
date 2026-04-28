import { fireEvent, render } from "@testing-library/react-native";

import { AppProviders } from "@/core/providers/app-providers";
import { DangerZoneScreen } from "@/features/user-profile/screens/danger-zone-screen";
import {
  useDangerZoneScreenController,
  type DangerZoneScreenController,
} from "@/features/user-profile/hooks/use-danger-zone-screen-controller";

const mockController: DangerZoneScreenController = {
  consent: false,
  confirmPhrase: "",
  password: "",
  canSubmit: false,
  isDeleting: false,
  submitError: null,
  handleConsentChange: jest.fn(),
  handleConfirmPhraseChange: jest.fn(),
  handlePasswordChange: jest.fn(),
  handleSubmit: jest.fn().mockResolvedValue(undefined),
  handleCancel: jest.fn(),
  dismissSubmitError: jest.fn(),
};

jest.mock(
  "@/features/user-profile/hooks/use-danger-zone-screen-controller",
  () => ({
    useDangerZoneScreenController: jest.fn(),
  }),
);

const mockedUseController = jest.mocked(useDangerZoneScreenController);

const renderScreen = (
  override: Partial<DangerZoneScreenController> = {},
): ReturnType<typeof render> => {
  mockedUseController.mockReturnValue({ ...mockController, ...override });
  return render(
    <AppProviders>
      <DangerZoneScreen />
    </AppProviders>,
  );
};

describe("DangerZoneScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the warning, confirmation and action sections", () => {
    const { getByText, getByTestId } = renderScreen();

    expect(getByText(/Excluir conta/i)).toBeTruthy();
    expect(getByText(/irreversivel|irreversível/i)).toBeTruthy();
    expect(getByText(/Para prosseguir/i)).toBeTruthy();
    expect(getByTestId("danger-zone-submit")).toBeTruthy();
  });

  it("disables submit button when canSubmit is false", () => {
    const { getByTestId } = renderScreen({ canSubmit: false });
    const button = getByTestId("danger-zone-submit");
    expect(button.props.accessibilityState?.disabled).toBe(true);
  });

  it("enables submit button when canSubmit is true and not deleting", () => {
    const { getByTestId } = renderScreen({ canSubmit: true, isDeleting: false });
    const button = getByTestId("danger-zone-submit");
    expect(button.props.accessibilityState?.disabled).toBe(false);
  });

  it("shows the deleting label when isDeleting is true", () => {
    const { getByText } = renderScreen({ canSubmit: true, isDeleting: true });
    expect(getByText(/Excluindo conta/i)).toBeTruthy();
  });

  it("forwards taps on the submit button", () => {
    const handleSubmit = jest.fn().mockResolvedValue(undefined);
    const { getByTestId } = renderScreen({ canSubmit: true, handleSubmit });

    fireEvent.press(getByTestId("danger-zone-submit"));

    expect(handleSubmit).toHaveBeenCalled();
  });

  it("shows the biometric error message when submitError kind is biometric", () => {
    const { getByText } = renderScreen({ submitError: { kind: "biometric" } });
    expect(getByText(/biometrica|biométrica/i)).toBeTruthy();
  });

  it("shows the backend error notice with retry copy", () => {
    const { getByText } = renderScreen({
      submitError: { kind: "backend", error: new Error("invalid password") },
    });
    expect(getByText(/Não foi possível excluir|Nao foi possivel excluir/i)).toBeTruthy();
  });

  it("validates the literal phrase only when not exactly matching", () => {
    const { getByText } = renderScreen({
      confirmPhrase: "excluir",
    });
    expect(getByText(/exatamente, em maiusculas|exatamente, em maiúsculas/i)).toBeTruthy();
  });
});
