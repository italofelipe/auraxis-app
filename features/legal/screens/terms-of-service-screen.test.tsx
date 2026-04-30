import { render } from "@testing-library/react-native";

import { TestProviders } from "@/shared/testing/test-providers";

import { TermsOfServiceScreen } from "@/features/legal/screens/terms-of-service-screen";

jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    canGoBack: jest.fn(() => true),
  }),
}));

describe("TermsOfServiceScreen", () => {
  it("renders the terms of service document", () => {
    const { getByText } = render(
      <TestProviders>
        <TermsOfServiceScreen />
      </TestProviders>,
    );
    expect(getByText("Termos de Uso")).toBeTruthy();
  });
});
