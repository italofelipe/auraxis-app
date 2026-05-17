import { act, renderHook } from "@testing-library/react-native";
import * as DocumentPicker from "expo-document-picker";

import type {
  ImportDetectResult,
  ImportPreview,
} from "@/features/import/contracts";
import {
  useConfirmImportMutation,
  useDetectImportMutation,
  usePreviewImportMutation,
} from "@/features/import/hooks/use-import-mutations";
import { useImportScreenController } from "@/features/import/hooks/use-import-screen-controller";

jest.mock("expo-document-picker", () => ({
  getDocumentAsync: jest.fn(),
}));
jest.mock("@/features/import/hooks/use-import-mutations", () => ({
  useDetectImportMutation: jest.fn(),
  usePreviewImportMutation: jest.fn(),
  useConfirmImportMutation: jest.fn(),
}));

const mockedDocumentPicker = jest.mocked(DocumentPicker.getDocumentAsync);
const mockedUseDetect = jest.mocked(useDetectImportMutation);
const mockedUsePreview = jest.mocked(usePreviewImportMutation);
const mockedUseConfirm = jest.mocked(useConfirmImportMutation);

const detectResult: ImportDetectResult = {
  fileType: "csv",
  sheetNames: ["Janeiro"],
  activeSheet: "Janeiro",
  headers: ["Data", "Descricao", "Valor", "Tipo"],
  sampleRows: [
    ["2026-05-01", "Uber", "25,50", "saida"],
    ["2026-05-02", "Salario", "5000,00", "entrada"],
  ],
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
    typeColumn: 0.6,
  },
};

const preview: ImportPreview = {
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
};

const buildMutation = <TData, TVariables>(resolvedValue: TData) => ({
  mutateAsync: jest.fn<Promise<TData>, [TVariables]>().mockResolvedValue(resolvedValue),
  reset: jest.fn(),
  isPending: false,
});

describe("useImportScreenController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedDocumentPicker.mockResolvedValue({
      canceled: false,
      assets: [
        {
          uri: "file:///cache/extrato.csv",
          name: "extrato.csv",
          mimeType: "text/csv",
          size: 1024,
          lastModified: 0,
        },
      ],
    });
    mockedUseDetect.mockReturnValue(buildMutation(detectResult) as never);
    mockedUsePreview.mockReturnValue(buildMutation(preview) as never);
    mockedUseConfirm.mockReturnValue(
      buildMutation({ importedCount: 1, skippedCount: 1 }) as never,
    );
  });

  it("inicia na fase de selecao", () => {
    const { result } = renderHook(() => useImportScreenController());
    expect(result.current.phase).toBe("select");
    expect(result.current.file).toBeNull();
  });

  it("seleciona arquivo nativo, detecta colunas e abre mapping para campos incertos", async () => {
    const { result } = renderHook(() => useImportScreenController());

    await act(async () => {
      await result.current.handlePickFile();
    });

    expect(mockedDocumentPicker).toHaveBeenCalledWith(
      expect.objectContaining({
        copyToCacheDirectory: true,
        multiple: false,
      }),
    );
    expect(result.current.phase).toBe("mapping");
    expect(result.current.mappingFields.map((field) => field.key)).toEqual([
      "descriptionColumn",
      "typeColumn",
    ]);
    expect(result.current.currentMappingField?.sampleValues).toEqual([
      "Uber",
      "Salario",
    ]);
  });

  it("pula mapeamento e gera preview quando deteccao vem com alta confianca", async () => {
    const highConfidenceDetectResult: ImportDetectResult = {
      ...detectResult,
      confidence: {
        dateColumn: 0.95,
        descriptionColumn: 0.95,
        amountColumn: 0.95,
        typeColumn: 0.95,
      },
    };
    const previewMutation = buildMutation(preview);
    mockedUseDetect.mockReturnValue(buildMutation(highConfidenceDetectResult) as never);
    mockedUsePreview.mockReturnValue(previewMutation as never);
    const { result } = renderHook(() => useImportScreenController());

    await act(async () => {
      await result.current.handlePickFile();
    });

    expect(previewMutation.mutateAsync).toHaveBeenCalledWith({
      file: expect.objectContaining({ name: "extrato.csv" }),
      mapping: highConfidenceDetectResult.suggestedMapping,
    });
    expect(result.current.phase).toBe("preview");
    expect(result.current.selectedImportCount).toBe(1);
  });

  it("gera preview, deixa duplicatas desmarcadas e confirma apenas selecionadas", async () => {
    const { result } = renderHook(() => useImportScreenController());

    await act(async () => {
      await result.current.handlePickFile();
    });
    await act(async () => {
      await result.current.handleConfirmMapping();
    });

    expect(result.current.phase).toBe("preview");
    expect(result.current.selectedImportCount).toBe(1);
    expect(result.current.isTransactionSelected("draft-1")).toBe(true);
    expect(result.current.isTransactionSelected("draft-2")).toBe(false);

    await act(async () => {
      await result.current.handleConfirmImport();
    });

    const confirmMutation = mockedUseConfirm.mock.results[0]?.value;
    expect(confirmMutation.mutateAsync).toHaveBeenCalledWith({
      previewToken: "preview-1",
      excludeIds: ["draft-2"],
    });
    expect(result.current.phase).toBe("success");
    expect(result.current.confirmationResult).toEqual({
      importedCount: 1,
      skippedCount: 1,
    });
  });
});
