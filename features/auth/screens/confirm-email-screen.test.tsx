import { fireEvent, render } from "@testing-library/react-native";

import { initI18n } from "@/shared/i18n";
import { TestProviders } from "@/shared/testing/test-providers";

import { ConfirmEmailScreen } from "@/features/auth/screens/confirm-email-screen";
import type { ConfirmEmailStatus } from "@/features/auth/hooks/use-confirm-email-screen-controller";

const mockHandleGoToDashboard = jest.fn();
const mockHandleGoToLogin = jest.fn();
const mockHandleResendConfirmation = jest.fn();

let mockControllerStatus: ConfirmEmailStatus = "no-token";

jest.mock("@/features/auth/hooks/use-confirm-email-screen-controller", () => ({
  useConfirmEmailScreenController: () => ({
    status: mockControllerStatus,
    message: null,
    error: mockControllerStatus === "error" ? new Error("expired") : null,
    hasToken: mockControllerStatus !== "no-token",
    handleGoToDashboard: mockHandleGoToDashboard,
    handleGoToLogin: mockHandleGoToLogin,
    handleResendConfirmation: mockHandleResendConfirmation,
  }),
}));

describe("ConfirmEmailScreen", () => {
  beforeAll(async () => {
    await initI18n("pt");
  });

  beforeEach(() => {
    mockHandleGoToDashboard.mockReset();
    mockHandleGoToLogin.mockReset();
    mockHandleResendConfirmation.mockReset();
    mockControllerStatus = "no-token";
  });

  it("renders the no-token outcome when no link parameters are present", () => {
    const { getByTestId, getByText } = render(
      <TestProviders>
        <ConfirmEmailScreen />
      </TestProviders>,
    );
    expect(getByTestId("confirm-email-no-token-card")).toBeTruthy();
    expect(getByText(/Token de confirmacao ausente/iu)).toBeTruthy();
  });

  it("renders the pending state while the mutation is in flight", () => {
    mockControllerStatus = "pending";
    const { getByText } = render(
      <TestProviders>
        <ConfirmEmailScreen />
      </TestProviders>,
    );
    expect(getByText(/Confirmando seu e-mail/iu)).toBeTruthy();
  });

  it("renders the success outcome with explore CTA", () => {
    mockControllerStatus = "success";
    const { getByTestId, getByText } = render(
      <TestProviders>
        <ConfirmEmailScreen />
      </TestProviders>,
    );
    expect(getByTestId("confirm-email-success-card")).toBeTruthy();
    fireEvent.press(getByText(/Ir para o app/iu));
    expect(mockHandleGoToDashboard).toHaveBeenCalledTimes(1);
  });

  it("renders the error outcome with resend CTA", () => {
    mockControllerStatus = "error";
    const { getByTestId, getByText } = render(
      <TestProviders>
        <ConfirmEmailScreen />
      </TestProviders>,
    );
    expect(getByTestId("confirm-email-error-card")).toBeTruthy();
    fireEvent.press(getByText(/Reenviar e-mail/iu));
    expect(mockHandleResendConfirmation).toHaveBeenCalledTimes(1);
  });

  it("error outcome also exposes back-to-login secondary action", () => {
    mockControllerStatus = "error";
    const { getByText } = render(
      <TestProviders>
        <ConfirmEmailScreen />
      </TestProviders>,
    );
    fireEvent.press(getByText(/Voltar para o login/iu));
    expect(mockHandleGoToLogin).toHaveBeenCalledTimes(1);
  });
});
