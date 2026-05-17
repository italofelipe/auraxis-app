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
      confidence: 0.88,
      isDuplicate: true,
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
    },
  ],
};

export const confirmImportFixture: ConfirmImportResult = {
  importedCount: 2,
  skippedCount: 1,
};
