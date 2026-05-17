import { fireEvent, render } from "@testing-library/react-native";

import { ApiError } from "@/core/http/api-error";
import { AppProviders } from "@/core/providers/app-providers";
import { useImportScreenController } from "@/features/import/hooks/use-import-screen-controller";
import { ImportScreen } from "@/features/import/screens/import-screen";

jest.mock("@/features/import/hooks/use-import-screen-controller", () => ({
  useImportScreenController: jest.fn(),
}));

const mockedUseController = jest.mocked(useImportScreenController);

const buildController = (
  overrides: Partial<ReturnType<typeof useImportScreenController>> = {},
) =>
  ({
    phase: "select",
    file: null,
    detectResult: null,
    preview: null,
    currentMappingIndex: 0,
    currentMappingField: null,
    mappingFields: [],
    selectedImportCount: 0,
    totalPreviewCount: 0,
    duplicateCount: 0,
    confirmationResult: null,
    error: null,
    isBusy: false,
    handlePickFile: jest.fn(),
    handleCancelMapping: jest.fn(),
    handlePreviousMappingField: jest.fn(),
    handleNextMappingField: jest.fn(),
    handleMappingChange: jest.fn(),
    handleConfirmMapping: jest.fn(),
    handleToggleTransaction: jest.fn(),
    handleConfirmImport: jest.fn(),
    handleReset: jest.fn(),
    dismissError: jest.fn(),
    isTransactionSelected: jest.fn().mockReturnValue(true),
    ...overrides,
  }) as ReturnType<typeof useImportScreenController>;

const renderScreen = (
  controller: ReturnType<typeof buildController>,
): ReturnType<typeof render> => {
  mockedUseController.mockReturnValue(controller);
  return render(
    <AppProviders>
      <ImportScreen />
    </AppProviders>,
  );
};

describe("ImportScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renderiza selecao de arquivo e chama handlePickFile", () => {
    const controller = buildController();
    const { getByText } = renderScreen(controller);

    fireEvent.press(getByText("Selecionar planilha"));

    expect(controller.handlePickFile).toHaveBeenCalled();
  });

  it("renderiza step de mapeamento com progresso e preview da coluna", () => {
    const controller = buildController({
      phase: "mapping",
      file: {
        uri: "file:///cache/extrato.csv",
        name: "extrato.csv",
        mimeType: "text/csv",
      },
      detectResult: {
        fileType: "csv",
        sheetNames: ["Janeiro"],
        activeSheet: "Janeiro",
        headers: ["Data", "Descricao", "Valor", "Tipo"],
        sampleRows: [["2026-05-01", "Uber", "25,50", "saida"]],
        suggestedMapping: {
          dateColumn: "Data",
          descriptionColumn: "Descricao",
          amountColumn: "Valor",
          typeColumn: "Tipo",
          sheetName: "Janeiro",
        },
        confidence: {
          dateColumn: 0.95,
          descriptionColumn: 0.65,
          amountColumn: 0.9,
          typeColumn: 0.8,
        },
      },
      currentMappingIndex: 0,
      mappingFields: [
        {
          key: "descriptionColumn",
          label: "Coluna de Descricao",
          value: "Descricao",
          confidence: 0.65,
          sampleValues: ["Uber", "Salario"],
        },
      ],
      currentMappingField: {
        key: "descriptionColumn",
        label: "Coluna de Descricao",
        value: "Descricao",
        confidence: 0.65,
        sampleValues: ["Uber", "Salario"],
      },
    });

    const { getAllByText, getByText } = renderScreen(controller);

    expect(getAllByText("Passo 1 de 1").length).toBeGreaterThan(0);
    expect(getByText("Coluna de Descricao")).toBeTruthy();
    expect(getByText(/Uber/)).toBeTruthy();
  });

  it("renderiza preview com banner de duplicatas e contador dinamico", () => {
    const controller = buildController({
      phase: "preview",
      duplicateCount: 1,
      selectedImportCount: 1,
      totalPreviewCount: 2,
      preview: {
        previewToken: "preview-1",
        expiresAt: "2026-05-17T14:00:00Z",
        fileType: "csv",
        totalCount: 2,
        duplicatesCount: 1,
        transactions: [
          {
            id: "draft-1",
            date: "2026-05-01",
            description: "Uber",
            amount: "25.50",
            type: "expense",
            category: "transporte",
            confidence: 0.92,
            isDuplicate: false,
          },
          {
            id: "draft-2",
            date: "2026-05-02",
            description: "Salario",
            amount: "5000.00",
            type: "income",
            category: "receita",
            confidence: null,
            isDuplicate: true,
          },
        ],
      },
      isTransactionSelected: jest.fn((transactionId: string) => transactionId === "draft-1"),
    });

    const { getAllByText, getByText, getByTestId } = renderScreen(controller);

    expect(getByText("1 possivel duplicata")).toBeTruthy();
    expect(getAllByText("Importar 1 de 2 transacoes").length).toBeGreaterThan(0);
    expect(getByText("Possivel duplicata")).toBeTruthy();

    fireEvent.press(getByTestId("import-transaction-toggle-draft-2"));
    expect(controller.handleToggleTransaction).toHaveBeenCalledWith("draft-2");
  });

  it("renderiza mensagem clara para preview expirado", () => {
    const controller = buildController({
      error: new ApiError({
        message: "preview expired",
        status: 422,
      }),
    });

    const { getByText } = renderScreen(controller);

    expect(getByText("Preview expirado")).toBeTruthy();
    fireEvent.press(getByText("Enviar novamente"));
    expect(controller.handleReset).toHaveBeenCalled();
  });

  it("renderiza sheet de upgrade quando limite gratuito e atingido", () => {
    const controller = buildController({
      error: new ApiError({
        message: "free import limit reached",
        status: 429,
      }),
    });

    const { getByText } = renderScreen(controller);

    expect(getByText("Limite gratuito atingido")).toBeTruthy();
    expect(getByText(/3 importacoes gratuitas/)).toBeTruthy();

    fireEvent.press(getByText("Fechar"));
    expect(controller.dismissError).toHaveBeenCalled();
  });
});
