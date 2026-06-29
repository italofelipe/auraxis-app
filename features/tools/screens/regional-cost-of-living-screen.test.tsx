import { fireEvent, render } from "@testing-library/react-native";

import { RegionalCostOfLivingScreen } from "@/features/tools/screens/regional-cost-of-living-screen";
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

const mockMutateAsync = jest.fn().mockResolvedValue({ id: "sim-regional" });
jest.mock("@/features/tools/hooks/use-save-simulation-mutation", () => ({
  useSaveSimulationMutation: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
    error: null,
  }),
}));

const wrap = (ui: React.ReactElement): React.ReactElement => (
  <TestProviders>{ui}</TestProviders>
);

describe("RegionalCostOfLivingScreen", () => {
  beforeEach(() => {
    mockBack.mockClear();
    mockAddListener.mockClear();
    mockMutateAsync.mockClear();
  });

  it("renderiza formulario mobile da ferramenta regional", () => {
    const { getByTestId, getByLabelText, getByText } = render(
      wrap(<RegionalCostOfLivingScreen />),
    );

    expect(getByTestId("regional-cost-of-living-screen")).toBeTruthy();
    expect(getByText("Custo de vida regional")).toBeTruthy();
    expect(getByLabelText("UF")).toBeTruthy();
    expect(getByLabelText("Renda mensal líquida (R$)")).toBeTruthy();
    expect(getByLabelText("Moradia (R$)")).toBeTruthy();
    expect(getByLabelText("Transporte (R$)")).toBeTruthy();
    expect(getByLabelText("Alimentação (R$)")).toBeTruthy();
  });

  it("calcula score, comparacao regional e patrimonio alvo", () => {
    const { getAllByText, getByLabelText, getByText } = render(
      wrap(<RegionalCostOfLivingScreen />),
    );

    fireEvent.changeText(getByLabelText("UF"), "SP");
    fireEvent.changeText(getByLabelText("Renda mensal líquida (R$)"), "10000");
    fireEvent.changeText(getByLabelText("Moradia (R$)"), "2500");
    fireEvent.changeText(getByLabelText("Transporte (R$)"), "800");
    fireEvent.changeText(getByLabelText("Alimentação (R$)"), "1500");
    fireEvent.changeText(getByLabelText("Lazer (R$)"), "700");
    fireEvent.changeText(getByLabelText("Outros (R$)"), "500");
    fireEvent.press(getByText("Calcular"));

    expect(getByText("Diagnóstico regional")).toBeTruthy();
    expect(getByText("Custo mensal")).toBeTruthy();
    expect(getByText("R$ 6.000,00")).toBeTruthy();
    expect(getByText("Score de sustentabilidade")).toBeTruthy();
    expect(getByText("Patrimônio alvo")).toBeTruthy();
    expect(getAllByText(/São Paulo/i).length).toBeGreaterThan(0);
  });
});
