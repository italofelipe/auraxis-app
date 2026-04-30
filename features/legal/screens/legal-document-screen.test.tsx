import { fireEvent, render } from "@testing-library/react-native";

import { TestProviders } from "@/shared/testing/test-providers";

import { LegalDocumentScreen } from "@/features/legal/screens/legal-document-screen";

const mockReplace = jest.fn();
const mockBack = jest.fn();
const mockCanGoBack = jest.fn(() => true);

jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: mockReplace,
    back: mockBack,
    canGoBack: mockCanGoBack,
  }),
}));

describe("LegalDocumentScreen", () => {
  beforeEach(() => {
    mockReplace.mockReset();
    mockBack.mockReset();
    mockCanGoBack.mockReset();
    mockCanGoBack.mockReturnValue(true);
  });

  it("renders the privacy policy by id", () => {
    const { getByText } = render(
      <TestProviders>
        <LegalDocumentScreen documentId="privacy-policy" testID="privacy-policy-screen" />
      </TestProviders>,
    );
    expect(getByText("Política de Privacidade")).toBeTruthy();
    expect(getByText("Auraxis")).toBeTruthy();
  });

  it("renders the terms of service by id", () => {
    const { getByText } = render(
      <TestProviders>
        <LegalDocumentScreen documentId="terms-of-service" testID="terms-of-service-screen" />
      </TestProviders>,
    );
    expect(getByText("Termos de Uso")).toBeTruthy();
  });

  it("calls router.back when Voltar is tapped and back is available", () => {
    const { getByText } = render(
      <TestProviders>
        <LegalDocumentScreen documentId="privacy-policy" testID="privacy-policy-screen" />
      </TestProviders>,
    );
    fireEvent.press(getByText("Voltar"));
    expect(mockBack).toHaveBeenCalledTimes(1);
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("falls back to /login when no back history is available", () => {
    mockCanGoBack.mockReturnValue(false);
    const { getByText } = render(
      <TestProviders>
        <LegalDocumentScreen documentId="privacy-policy" testID="privacy-policy-screen" />
      </TestProviders>,
    );
    fireEvent.press(getByText("Voltar"));
    expect(mockReplace).toHaveBeenCalledWith("/login");
  });

  it("navigates to the sibling document via router.replace", () => {
    const { getByText } = render(
      <TestProviders>
        <LegalDocumentScreen documentId="privacy-policy" testID="privacy-policy-screen" />
      </TestProviders>,
    );
    fireEvent.press(getByText("Ver Termos de Uso"));
    expect(mockReplace).toHaveBeenCalledWith("/terms-of-service");
  });
});
