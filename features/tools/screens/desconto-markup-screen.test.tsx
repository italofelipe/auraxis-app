import { fireEvent, render } from "@testing-library/react-native";

import { DescontoMarkupScreen } from "@/features/tools/screens/desconto-markup-screen";
import { TestProviders } from "@/shared/testing/test-providers";

const mockBack = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ back: mockBack, push: jest.fn(), replace: jest.fn() }),
}));

const mockMutateAsync = jest.fn().mockResolvedValue({ id: "sim-1" });
jest.mock("@/features/tools/hooks/use-save-simulation-mutation", () => ({
  useSaveSimulationMutation: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
    error: null,
  }),
}));

const wrap = (ui: React.ReactElement) => <TestProviders>{ui}</TestProviders>;

describe("DescontoMarkupScreen", () => {
  beforeEach(() => {
    mockBack.mockClear();
    mockMutateAsync.mockClear();
  });

  it("renderiza o cabecalho e o toggle dos quatro modos", () => {
    const { getByTestId } = render(wrap(<DescontoMarkupScreen />));
    expect(getByTestId("desconto-markup-screen")).toBeTruthy();
    ["desconto", "markup", "margem", "reverso"].forEach((mode) => {
      expect(getByTestId(`desconto-markup-mode-${mode}`)).toBeTruthy();
    });
  });

  it("trocar para markup esconde o campo de preco e expoe custo", () => {
    const { getByTestId, queryByText, getByText } = render(
      wrap(<DescontoMarkupScreen />),
    );
    expect(queryByText("Custo (R$)")).toBeNull();
    fireEvent.press(getByTestId("desconto-markup-mode-markup"));
    expect(getByText("Custo (R$)")).toBeTruthy();
  });

  it("trocar para margem expoe custo e esconde campo de pct", () => {
    const { getByTestId, getByText, queryByText } = render(
      wrap(<DescontoMarkupScreen />),
    );
    fireEvent.press(getByTestId("desconto-markup-mode-margem"));
    expect(getByText("Custo (R$)")).toBeTruthy();
    expect(queryByText("Desconto (%)")).toBeNull();
    expect(queryByText("Markup (%)")).toBeNull();
  });

  it("trocar para reverso renomeia o label do preco para final", () => {
    const { getByTestId, getByText } = render(
      wrap(<DescontoMarkupScreen />),
    );
    fireEvent.press(getByTestId("desconto-markup-mode-reverso"));
    expect(getByText("Preco final apos desconto (R$)")).toBeTruthy();
  });
});
