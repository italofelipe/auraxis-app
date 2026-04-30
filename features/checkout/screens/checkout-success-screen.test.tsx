import { fireEvent, render } from "@testing-library/react-native";

import { initI18n } from "@/shared/i18n";
import { TestProviders } from "@/shared/testing/test-providers";

import { CheckoutSuccessScreen } from "@/features/checkout/screens/checkout-success-screen";

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

describe("CheckoutSuccessScreen", () => {
  beforeAll(async () => {
    await initI18n("pt");
  });

  beforeEach(() => {
    mockReplace.mockReset();
    mockedSearchParams = {};
  });

  it("renders the success outcome card", () => {
    const { getByTestId } = render(
      <TestProviders>
        <CheckoutSuccessScreen />
      </TestProviders>,
    );
    expect(getByTestId("checkout-success-card")).toBeTruthy();
  });

  it("renders the pending notice when gateway is still confirming", () => {
    mockedSearchParams = { status: "pending" };
    const { getByText } = render(
      <TestProviders>
        <CheckoutSuccessScreen />
      </TestProviders>,
    );
    expect(getByText(/confirmando o pagamento/iu)).toBeTruthy();
  });

  it("does not render the pending notice when status is already success", () => {
    mockedSearchParams = { status: "paid" };
    const { queryByText } = render(
      <TestProviders>
        <CheckoutSuccessScreen />
      </TestProviders>,
    );
    expect(queryByText(/confirmando o pagamento/iu)).toBeNull();
  });

  it("primary CTA navigates to /dashboard", () => {
    const { getByText } = render(
      <TestProviders>
        <CheckoutSuccessScreen />
      </TestProviders>,
    );
    fireEvent.press(getByText(/Explorar o app/iu));
    expect(mockReplace).toHaveBeenCalledWith("/dashboard");
  });
});
