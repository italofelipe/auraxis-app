import type {
  ConfirmImportResult,
  ImportDetectResult,
  ImportPreview,
} from "@/features/import/contracts";

export const importDetectFixture: ImportDetectResult = {
  fileType: "csv",
  sheetNames: ["Janeiro"],
  activeSheet: "Janeiro",
  headers: ["Data", "Descricao", "Valor", "Tipo"],
  sampleRows: [
    ["2026-05-01", "Uber", "25,50", "saida"],
    ["2026-05-02", "Salario", "5000,00", "entrada"],
    ["2026-05-03", "Mercado", "180,30", "saida"],
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
    typeColumn: 0.62,
  },
};

export const importPreviewFixture: ImportPreview = {
  previewToken: "preview-token-1",
  expiresAt: "2026-05-17T14:00:00Z",
  fileType: "csv",
  totalCount: 3,
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
      confidence: 0.88,
      isDuplicate: true,
      missingFields: [],
    },
    {
      id: "draft-3",
      date: "2026-05-03",
      description: "Mercado",
      amount: "180.30",
      type: "expense",
      category: "alimentacao",
      confidence: 0.78,
      isDuplicate: false,
      missingFields: [],
    },
  ],
};

export const confirmImportFixture: ConfirmImportResult = {
  importedCount: 2,
  skippedCount: 1,
  errors: [],
};

/** Preview com uma linha sem título e outra sem valor, para a conferência. */
export const importPreviewWithIncompleteFixture: ImportPreview = {
  ...importPreviewFixture,
  incompleteCount: 2,
  transactions: [
    { ...importPreviewFixture.transactions[0], missingFields: ["description"] },
    importPreviewFixture.transactions[1],
    { ...importPreviewFixture.transactions[2], missingFields: ["amount"] },
  ],
};

/** Preview em que o parser perdeu duas linhas do arquivo. */
export const importPreviewWithRejectedRowsFixture: ImportPreview = {
  ...importPreviewFixture,
  rejectedRows: [
    { lineNumber: 7, reason: "Data inválida: 31/02/2026" },
    { lineNumber: 12, reason: "Linha truncada: faltam colunas" },
  ],
};
