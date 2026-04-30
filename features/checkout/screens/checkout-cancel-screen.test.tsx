import { fireEvent, render } from "@testing-library/react-native";

import { initI18n } from "@/shared/i18n";
import { TestProviders } from "@/shared/testing/test-providers";

import { CheckoutCancelScreen } from "@/features/checkout/screens/checkout-cancel-screen";

const mockReplace = jest.fn();
let mockedSearchParams: Record<string, string> = {};

jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: mockReplace,
    back: jest.fn(),
    canGoBack: jest.fn(() => true),
  }),
  useLocalSearchParams: () => mockedSearchParams,
}));

describe("CheckoutCancelScreen", () => {
  beforeAll(async () => {
    await initI18n("pt");
  });

  beforeEach(() => {
    mockReplace.mockReset();
    mockedSearchParams = {};
  });

  it("renders the cancel outcome card", () => {
    const { getByTestId } = render(
      <TestProviders>
        <CheckoutCancelScreen />
      </TestProviders>,
    );
    expect(getByTestId("checkout-cancel-card")).toBeTruthy();
  });

  it("renders the error notice when status is error", () => {
    mockedSearchParams = { status: "error" };
    const { getByText } = render(
      <TestProviders>
        <CheckoutCancelScreen />
      </TestProviders>,
    );
    expect(getByText(/processador retornou um erro/iu)).toBeTruthy();
  });

  it("does not render the error notice when status is plain cancel", () => {
    mockedSearchParams = { status: "cancel" };
    const { queryByText } = render(
      <TestProviders>
        <CheckoutCancelScreen />
      </TestProviders>,
    );
    expect(queryByText(/processador retornou um erro/iu)).toBeNull();
  });

  it("retry CTA navigates to /assinatura", () => {
    const { getAllByText } = render(
      <TestProviders>
        <CheckoutCancelScreen />
      </TestProviders>,
    );
    const buttons = getAllByText(/Tentar novamente/iu);
    fireEvent.press(buttons[buttons.length - 1]!);
    expect(mockReplace).toHaveBeenCalledWith("/assinatura");
  });

  it("back CTA navigates to /dashboard", () => {
    const { getByText } = render(
      <TestProviders>
        <CheckoutCancelScreen />
      </TestProviders>,
    );
    fireEvent.press(getByText(/Voltar/iu));
    expect(mockReplace).toHaveBeenCalledWith("/dashboard");
  });
});
