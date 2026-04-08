import type {
  CsvConfirmResponse,
  CsvPreviewResponse,
  FiscalDocumentListResponse,
  ReceivableListResponse,
  RevenueSummary,
} from "@/features/fiscal/contracts";

export const csvPreviewFixture: CsvPreviewResponse = {
  preview: [
    {
      description: "Nota fiscal de serviço",
      amount: "1500.00",
      date: "2026-04-01",
      category: "servicos",
      externalId: "nf-1",
    },
  ],
  totalRows: 1,
  validRows: 1,
  errorRows: 0,
  errors: [],
};

export const csvConfirmFixture: CsvConfirmResponse = {
  importId: "import-1",
  importedCount: 1,
  skippedDuplicates: 0,
  errorRows: 0,
  errors: [],
};

export const receivableListFixture: ReceivableListResponse = {
  receivables: [
    {
      id: "receivable-1",
      fiscalDocumentId: "doc-1",
      expectedNetAmount: "1500.00",
      receivedAmount: null,
      outstandingAmount: null,
      reconciliationStatus: "pending",
      receivedAt: null,
      createdAt: "2026-04-01T10:00:00Z",
      disclaimer:
        "Este valor é estimativo e não substitui cálculo fiscal por profissional habilitado",
    },
  ],
  count: 1,
};

export const revenueSummaryFixture: RevenueSummary = {
  expectedTotal: "1500.00",
  receivedTotal: "0.00",
  pendingTotal: "1500.00",
  disclaimer:
    "Este valor é estimativo e não substitui cálculo fiscal por profissional habilitado",
};

export const fiscalDocumentListFixture: FiscalDocumentListResponse = {
  fiscalDocuments: [
    {
      id: "doc-1",
      externalId: "nf-1",
      type: "service_invoice",
      status: "issued",
      issuedAt: "2026-04-01",
      counterparty: "Cliente A",
      grossAmount: "1500.00",
      currency: "BRL",
      description: "Projeto mensal",
      createdAt: "2026-04-01T10:00:00Z",
    },
  ],
  count: 1,
};
