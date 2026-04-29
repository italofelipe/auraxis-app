import { fireEvent, render } from "@testing-library/react-native";

import { AppProviders } from "@/core/providers/app-providers";
import { ToolsScreen } from "@/features/tools/screens/tools-screen";
import { useToolsScreenController } from "@/features/tools/hooks/use-tools-screen-controller";

jest.mock("@/features/tools/hooks/use-tools-screen-controller", () => ({
  useToolsScreenController: jest.fn(),
}));

const mockedUseController = jest.mocked(useToolsScreenController);

const buildController = (
  overrides: Partial<ReturnType<typeof useToolsScreenController>> = {},
) =>
  ({
    toolsCatalogQuery: {
      data: { tools: [] },
      isLoading: false,
      isFetching: false,
      isSuccess: true,
      isError: false,
      isPending: false,
      refetch: jest.fn(),
    },
    searchTerm: "",
    handleSearchChange: jest.fn(),
    visibleSections: [],
    emptyResults: false,
    handleOpenTool: jest.fn(),
    handleOpenSimulationsHistory: jest.fn(),
    ...overrides,
  }) as never;

const renderWithProviders = (
  controller: ReturnType<typeof buildController>,
): ReturnType<typeof render> => {
  mockedUseController.mockReturnValue(controller);
  return render(
    <AppProviders>
      <ToolsScreen />
    </AppProviders>,
  );
};

describe("ToolsScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renderiza header com search bar e CTA para simulações salvas", () => {
    const { getByLabelText, getByTestId } = renderWithProviders(buildController());
    expect(getByLabelText("Buscar ferramenta")).toBeTruthy();
    expect(getByTestId("tools-open-simulations-history")).toBeTruthy();
  });

  it("encaminha tap no CTA de simulações para handleOpenSimulationsHistory", () => {
    const handleOpenSimulationsHistory = jest.fn();
    const { getByTestId } = renderWithProviders(
      buildController({ handleOpenSimulationsHistory }),
    );
    fireEvent.press(getByTestId("tools-open-simulations-history"));
    expect(handleOpenSimulationsHistory).toHaveBeenCalled();
  });

  it("encaminha mudança no search para o controller", () => {
    const handleSearchChange = jest.fn();
    const { getByLabelText } = renderWithProviders(
      buildController({ handleSearchChange }),
    );
    fireEvent.changeText(getByLabelText("Buscar ferramenta"), "salário");
    expect(handleSearchChange).toHaveBeenCalledWith("salário");
  });

  it("renderiza cards das categorias visíveis e abre tool habilitada ao tap", () => {
    const handleOpenTool = jest.fn();
    const enabledTool = {
      id: "installment-vs-cash",
      slug: "parcelado-vs-a-vista",
      name: "Parcelado vs à vista",
      description: "Compare parcelado e à vista",
      category: "daily-life" as const,
      enabled: true,
      route: "/installment-vs-cash",
    };
    const disabledTool = {
      id: "fire",
      slug: "fire",
      name: "FIRE",
      description: "Quando você fica financeiramente independente",
      category: "investments" as const,
      enabled: false,
    };

    const { getByText, getByTestId } = renderWithProviders(
      buildController({
        toolsCatalogQuery: {
          data: { tools: [enabledTool, disabledTool] },
          isLoading: false,
          isFetching: false,
          isSuccess: true,
          isError: false,
          isPending: false,
          refetch: jest.fn(),
        } as never,
        visibleSections: [
          { category: "daily-life", tools: [enabledTool] },
          { category: "investments", tools: [disabledTool] },
        ],
        handleOpenTool,
      }),
    );

    expect(getByText("Parcelado vs à vista")).toBeTruthy();
    expect(getByText("FIRE")).toBeTruthy();
    expect(getByText("Em breve")).toBeTruthy();

    fireEvent.press(getByTestId("tool-card-installment-vs-cash"));
    expect(handleOpenTool).toHaveBeenCalledWith(enabledTool);

    fireEvent.press(getByTestId("tool-card-fire"));
    expect(handleOpenTool).toHaveBeenCalledTimes(1);
  });

  it("mostra empty state quando emptyResults e há tools no catálogo", () => {
    const { getByText } = renderWithProviders(
      buildController({
        toolsCatalogQuery: {
          data: { tools: [{ id: "x" }] },
          isLoading: false,
          isFetching: false,
          isSuccess: true,
          isError: false,
          isPending: false,
          refetch: jest.fn(),
        } as never,
        emptyResults: true,
      }),
    );
    expect(getByText(/Nada encontrado/i)).toBeTruthy();
  });
});
