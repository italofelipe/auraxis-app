export interface CsvPreviewRow {
  readonly description: string;
  readonly amount: string;
  readonly date: string;
  readonly category: string | null;
  readonly externalId: string | null;
}

export interface CsvPreviewResponse {
  readonly preview: CsvPreviewRow[];
  readonly totalRows: number;
  readonly validRows: number;
  readonly errorRows: number;
  readonly errors: readonly unknown[];
}

export interface CsvPreviewCommand {
  readonly content: string;
  readonly columnMap?: Record<string, string>;
}

export interface CsvConfirmCommand extends CsvPreviewCommand {
  readonly filename?: string | null;
}

export interface CsvConfirmResponse {
  readonly importId: string;
  readonly importedCount: number;
  readonly skippedDuplicates: number;
  readonly errorRows: number;
  readonly errors: readonly unknown[];
}

export interface ReceivableRecord {
  readonly id: string;
  readonly fiscalDocumentId: string;
  readonly expectedNetAmount: string | null;
  readonly receivedAmount: string | null;
  readonly outstandingAmount: string | null;
  readonly reconciliationStatus: string;
  readonly receivedAt: string | null;
  readonly createdAt: string | null;
  readonly disclaimer: string;
}

export interface ReceivableListResponse {
  readonly receivables: ReceivableRecord[];
  readonly count: number;
}

export interface ReceivableListQuery {
  readonly status?: "pending" | "received" | "cancelled";
}

export interface CreateReceivableCommand {
  readonly description: string;
  readonly amount: string;
  readonly expectedDate: string;
  readonly category?: string | null;
}

export interface MarkReceivableReceivedCommand {
  readonly receivedDate: string;
  readonly receivedAmount?: string | null;
}

export interface RevenueSummary {
  readonly expectedTotal: string;
  readonly receivedTotal: string;
  readonly pendingTotal: string;
  readonly disclaimer: string;
}

export interface FiscalDocumentRecord {
  readonly id: string;
  readonly externalId: string | null;
  readonly type: string;
  readonly status: string;
  readonly issuedAt: string | null;
  readonly counterparty: string | null;
  readonly grossAmount: string;
  readonly currency: string;
  readonly description: string | null;
  readonly createdAt: string | null;
}

export interface FiscalDocumentListResponse {
  readonly fiscalDocuments: FiscalDocumentRecord[];
  readonly count: number;
}

export interface FiscalDocumentListQuery {
  readonly type?: string;
}

export interface CreateFiscalDocumentCommand {
  readonly type: string;
  readonly amount: string;
  readonly issuedAt: string;
  readonly counterpartName?: string | null;
  readonly externalId?: string | null;
  readonly rawData?: Record<string, unknown> | null;
}
