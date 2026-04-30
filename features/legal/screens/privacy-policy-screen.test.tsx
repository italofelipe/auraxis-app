import { render } from "@testing-library/react-native";

import { TestProviders } from "@/shared/testing/test-providers";

import { PrivacyPolicyScreen } from "@/features/legal/screens/privacy-policy-screen";

jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    canGoBack: jest.fn(() => true),
  }),
}));

describe("PrivacyPolicyScreen", () => {
  it("renders the privacy policy document", () => {
    const { getByText } = render(
      <TestProviders>
        <PrivacyPolicyScreen />
      </TestProviders>,
    );
    expect(getByText("Política de Privacidade")).toBeTruthy();
  });
});
