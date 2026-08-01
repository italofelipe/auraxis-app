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
  incompleteCount: 0,
  rejectedRows: [],
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
      missingFields: [],
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
      missingFields: [],
    },
  ],
};

const incompletePreview: ImportPreview = {
  ...preview,
  incompleteCount: 2,
  rejectedRows: [{ lineNumber: 9, reason: "Data invalida" }],
  transactions: [
    { ...preview.transactions[0]!, description: "", missingFields: ["description"] },
    { ...preview.transactions[1]!, isDuplicate: false, amount: "0", missingFields: ["amount"] },
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

describe("useImportScreenController — conferência de linhas incompletas", () => {
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
      buildMutation({ importedCount: 1, skippedCount: 1, errors: [] }) as never,
    );
  });

  it("desvia para a conferencia em vez de importar quando ha linha incompleta", async () => {
    mockedUsePreview.mockReturnValue(buildMutation(incompletePreview) as never);
    const confirmMutation = buildMutation({
      importedCount: 2,
      skippedCount: 0,
      errors: [],
    });
    mockedUseConfirm.mockReturnValue(confirmMutation as never);
    const { result } = renderHook(() => useImportScreenController());

    await act(async () => {
      await result.current.handlePickFile();
    });
    await act(async () => {
      await result.current.handleConfirmMapping();
    });
    await act(async () => {
      await result.current.handleConfirmImport();
    });

    // Nada entra pela metade sem o usuario saber (#760).
    expect(result.current.phase).toBe("review");
    expect(confirmMutation.mutateAsync).not.toHaveBeenCalled();
    expect(result.current.review.totalCount).toBe(2);
    expect(result.current.review.pendingCount).toBe(2);
  });

  it("expoe as linhas que o parser nao conseguiu ler", async () => {
    mockedUsePreview.mockReturnValue(buildMutation(incompletePreview) as never);
    const { result } = renderHook(() => useImportScreenController());

    await act(async () => {
      await result.current.handlePickFile();
    });
    await act(async () => {
      await result.current.handleConfirmMapping();
    });

    expect(result.current.rejectedRows).toEqual([
      { lineNumber: 9, reason: "Data invalida" },
    ]);
  });

  it("bloqueia o envio da conferencia enquanto sobrar pendencia", async () => {
    mockedUsePreview.mockReturnValue(buildMutation(incompletePreview) as never);
    const confirmMutation = buildMutation({
      importedCount: 2,
      skippedCount: 0,
      errors: [],
    });
    mockedUseConfirm.mockReturnValue(confirmMutation as never);
    const { result } = renderHook(() => useImportScreenController());

    await act(async () => {
      await result.current.handlePickFile();
    });
    await act(async () => {
      await result.current.handleConfirmMapping();
    });
    await act(async () => {
      await result.current.handleConfirmImport();
    });
    await act(async () => {
      await result.current.handleSubmitReview();
    });

    expect(confirmMutation.mutateAsync).not.toHaveBeenCalled();
    expect(result.current.phase).toBe("review");
  });

  it("confirma com as respostas da conferencia quando tudo foi preenchido", async () => {
    mockedUsePreview.mockReturnValue(buildMutation(incompletePreview) as never);
    const confirmMutation = buildMutation({
      importedCount: 2,
      skippedCount: 0,
      errors: [],
    });
    mockedUseConfirm.mockReturnValue(confirmMutation as never);
    const { result } = renderHook(() => useImportScreenController());

    await act(async () => {
      await result.current.handlePickFile();
    });
    await act(async () => {
      await result.current.handleConfirmMapping();
    });
    await act(async () => {
      await result.current.handleConfirmImport();
    });
    act(() => {
      result.current.review.answer("draft-1", "description", "Mercado");
      result.current.review.answer("draft-2", "amount", "149,90");
    });
    await act(async () => {
      await result.current.handleSubmitReview();
    });

    expect(confirmMutation.mutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        previewToken: "preview-1",
        completions: {
          "draft-1": { description: "Mercado" },
          "draft-2": { amount: "149,90" },
        },
      }),
    );
    expect(result.current.phase).toBe("success");
  });
});

describe("useImportScreenController — terminar depois e seleção", () => {
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
      buildMutation({ importedCount: 1, skippedCount: 1, errors: [] }) as never,
    );
  });

  it("terminar depois confirma com placeholders sem descartar o que ja foi respondido", async () => {
    mockedUsePreview.mockReturnValue(buildMutation(incompletePreview) as never);
    const confirmMutation = buildMutation({
      importedCount: 2,
      skippedCount: 0,
      errors: [],
    });
    mockedUseConfirm.mockReturnValue(confirmMutation as never);
    const { result } = renderHook(() => useImportScreenController());

    await act(async () => {
      await result.current.handlePickFile();
    });
    await act(async () => {
      await result.current.handleConfirmMapping();
    });
    await act(async () => {
      await result.current.handleConfirmImport();
    });
    act(() => {
      result.current.review.answer("draft-1", "description", "Mercado");
      result.current.handleOpenFinishLater();
    });

    expect(result.current.isFinishLaterOpen).toBe(true);

    await act(async () => {
      await result.current.handleConfirmWithPlaceholders();
    });

    expect(confirmMutation.mutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        useGenericPlaceholders: true,
        completions: { "draft-1": { description: "Mercado" } },
      }),
    );
    expect(result.current.isFinishLaterOpen).toBe(false);
    expect(result.current.phase).toBe("success");
  });

  it("linha desmarcada deixa de exigir conferencia", async () => {
    mockedUsePreview.mockReturnValue(buildMutation(incompletePreview) as never);
    const confirmMutation = buildMutation({
      importedCount: 1,
      skippedCount: 1,
      errors: [],
    });
    mockedUseConfirm.mockReturnValue(confirmMutation as never);
    const { result } = renderHook(() => useImportScreenController());

    await act(async () => {
      await result.current.handlePickFile();
    });
    await act(async () => {
      await result.current.handleConfirmMapping();
    });
    act(() => {
      result.current.handleToggleTransaction("draft-1");
      result.current.handleToggleTransaction("draft-2");
    });

    // Desmarcar e uma resposta valida para "nao quero essa transacao".
    expect(result.current.review.totalCount).toBe(0);
  });

  it("volta da conferencia para o preview sem perder a selecao", async () => {
    mockedUsePreview.mockReturnValue(buildMutation(incompletePreview) as never);
    const { result } = renderHook(() => useImportScreenController());

    await act(async () => {
      await result.current.handlePickFile();
    });
    await act(async () => {
      await result.current.handleConfirmMapping();
    });
    await act(async () => {
      await result.current.handleConfirmImport();
    });
    act(() => {
      result.current.handleCancelReview();
    });

    expect(result.current.phase).toBe("preview");
    expect(result.current.selectedImportCount).toBe(2);
  });
});
