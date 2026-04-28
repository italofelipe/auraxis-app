import { render } from "@testing-library/react-native";

import { ResendConfirmationScreen } from "@/features/auth/screens/resend-confirmation-screen";
import {
  useResendConfirmationScreenController,
  type ResendConfirmationScreenController,
} from "@/features/auth/hooks/use-resend-confirmation-screen-controller";
import { initI18n } from "@/shared/i18n";
import { TestProviders } from "@/shared/testing/test-providers";

jest.mock(
  "@/features/auth/hooks/use-resend-confirmation-screen-controller",
  () => ({
    useResendConfirmationScreenController: jest.fn(),
  }),
);

const mockedController = jest.mocked(useResendConfirmationScreenController);

const buildController = (
  overrides: Partial<ResendConfirmationScreenController> = {},
): ResendConfirmationScreenController => {
  return {
    email: "user@example.com",
    canEditEmail: false,
    setEmail: jest.fn(),
    isSubmitting: false,
    hasSucceeded: false,
    submitError: null,
    remainingSeconds: 0,
    handleSubmit: jest.fn().mockResolvedValue(undefined),
    dismissSubmitError: jest.fn(),
    handleBackToLogin: jest.fn(),
    ...overrides,
  };
};

describe("ResendConfirmationScreen", () => {
  beforeAll(async () => {
    await initI18n("pt");
  });

  beforeEach(() => {
    mockedController.mockReturnValue(buildController());
  });

  it("renders the title and primary action", () => {
    const { getAllByText } = render(
      <TestProviders>
        <ResendConfirmationScreen />
      </TestProviders>,
    );
    expect(getAllByText(/Reenviar/i).length).toBeGreaterThan(0);
  });

  it("disables the submit while a rate-limit window is pending", () => {
    mockedController.mockReturnValue(
      buildController({ remainingSeconds: 30 }),
    );
    const { getByText } = render(
      <TestProviders>
        <ResendConfirmationScreen />
      </TestProviders>,
    );
    expect(getByText(/Aguarde 30s/)).toBeTruthy();
  });

  it("surfaces success copy when hasSucceeded is true", () => {
    mockedController.mockReturnValue(buildController({ hasSucceeded: true }));
    const { getByText } = render(
      <TestProviders>
        <ResendConfirmationScreen />
      </TestProviders>,
    );
    expect(getByText(/Pronto!/)).toBeTruthy();
  });
});
