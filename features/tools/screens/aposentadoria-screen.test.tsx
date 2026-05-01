import { render } from "@testing-library/react-native";

import { AposentadoriaScreen } from "@/features/tools/screens/aposentadoria-screen";
import { TestProviders } from "@/shared/testing/test-providers";

const mockBack = jest.fn();
const mockAddListener = jest.fn().mockReturnValue(jest.fn());
jest.mock("expo-router", () => ({
  useRouter: () => ({ back: mockBack, push: jest.fn(), replace: jest.fn() }),
  useNavigation: () => ({
    addListener: mockAddListener,
    dispatch: jest.fn(),
  }),
}));

jest.mock("@/features/tools/hooks/use-save-simulation-mutation", () => ({
  useSaveSimulationMutation: () => ({
    mutateAsync: jest.fn(),
    isPending: false,
    error: null,
  }),
}));

const wrap = (ui: React.ReactElement) => <TestProviders>{ui}</TestProviders>;

describe("AposentadoriaScreen", () => {
  beforeEach(() => {
    mockBack.mockClear();
  });

  it("renderiza o cabecalho e os campos canonicos", () => {
    const { getByTestId, getByText } = render(wrap(<AposentadoriaScreen />));
    expect(getByTestId("aposentadoria-screen")).toBeTruthy();
    expect(getByText("Aposentadoria")).toBeTruthy();
    expect(getByText(/Idade atual/)).toBeTruthy();
    expect(getByText(/Renda mensal desejada/)).toBeTruthy();
  });

  it("renderiza os campos auxiliares (helper text)", () => {
    const { getByText } = render(wrap(<AposentadoriaScreen />));
    expect(getByText(/regra dos 25x/)).toBeTruthy();
  });
});
