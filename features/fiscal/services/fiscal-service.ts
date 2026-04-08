import type { AxiosInstance } from "axios";

import { unwrapEnvelopeData } from "@/core/http/contracts";
import { httpClient } from "@/core/http/http-client";
import type {
  CreateFiscalDocumentCommand,
  CreateReceivableCommand,
  CsvConfirmCommand,
  CsvConfirmResponse,
  CsvPreviewCommand,
  CsvPreviewResponse,
  FiscalDocumentListQuery,
  FiscalDocumentListResponse,
  FiscalDocumentRecord,
  MarkReceivableReceivedCommand,
  ReceivableListQuery,
  ReceivableListResponse,
  ReceivableRecord,
  RevenueSummary,
} from "@/features/fiscal/contracts";
import { apiContractMap } from "@/shared/contracts/api-contract-map";

interface ReceivablePayload {
  readonly id: string;
  readonly fiscal_document_id: string;
  readonly expected_net_amount: string | null;
  readonly received_amount: string | null;
  readonly outstanding_amount: string | null;
  readonly reconciliation_status: string;
  readonly received_at: string | null;
  readonly created_at: string | null;
  readonly disclaimer: string;
}

interface FiscalDocumentPayload {
  readonly id: string;
  readonly external_id: string | null;
  readonly type: string;
  readonly status: string;
  readonly issued_at: string | null;
  readonly counterparty: string | null;
  readonly gross_amount: string;
  readonly currency: string;
  readonly description: string | null;
  readonly created_at: string | null;
}

const mapReceivable = (payload: ReceivablePayload): ReceivableRecord => {
  return {
    id: payload.id,
    fiscalDocumentId: payload.fiscal_document_id,
    expectedNetAmount: payload.expected_net_amount,
    receivedAmount: payload.received_amount,
    outstandingAmount: payload.outstanding_amount,
    reconciliationStatus: payload.reconciliation_status,
    receivedAt: payload.received_at,
    createdAt: payload.created_at,
    disclaimer: payload.disclaimer,
  };
};

const mapFiscalDocument = (
  payload: FiscalDocumentPayload,
): FiscalDocumentRecord => {
  return {
    id: payload.id,
    externalId: payload.external_id,
    type: payload.type,
    status: payload.status,
    issuedAt: payload.issued_at,
    counterparty: payload.counterparty,
    grossAmount: payload.gross_amount,
    currency: payload.currency,
    description: payload.description,
    createdAt: payload.created_at,
  };
};

export const createFiscalService = (client: AxiosInstance) => {
  return {
    previewCsv: async (command: CsvPreviewCommand): Promise<CsvPreviewResponse> => {
      const response = await client.post(apiContractMap.fiscalCsvPreview.path, {
        content: command.content,
        column_map: command.columnMap,
      });
      const payload = unwrapEnvelopeData<{
        readonly preview: CsvPreviewResponse["preview"];
        readonly total_rows: number;
        readonly valid_rows: number;
        readonly error_rows: number;
        readonly errors: readonly unknown[];
      }>(response.data);
      return {
        preview: payload.preview,
        totalRows: payload.total_rows,
        validRows: payload.valid_rows,
        errorRows: payload.error_rows,
        errors: payload.errors,
      };
    },
    confirmCsv: async (command: CsvConfirmCommand): Promise<CsvConfirmResponse> => {
      const response = await client.post(apiContractMap.fiscalCsvConfirm.path, {
        content: command.content,
        column_map: command.columnMap,
        filename: command.filename,
      });
      const payload = unwrapEnvelopeData<{
        readonly import_id: string;
        readonly imported_count: number;
        readonly skipped_duplicates: number;
        readonly error_rows: number;
        readonly errors: readonly unknown[];
      }>(response.data);
      return {
        importId: payload.import_id,
        importedCount: payload.imported_count,
        skippedDuplicates: payload.skipped_duplicates,
        errorRows: payload.error_rows,
        errors: payload.errors,
      };
    },
    listReceivables: async (
      query: ReceivableListQuery = {},
    ): Promise<ReceivableListResponse> => {
      const response = await client.get(apiContractMap.fiscalReceivablesList.path, {
        params: {
          status: query.status,
        },
      });
      const payload = unwrapEnvelopeData<{
        readonly receivables: ReceivablePayload[];
        readonly count: number;
      }>(response.data);
      return {
        receivables: payload.receivables.map(mapReceivable),
        count: payload.count,
      };
    },
    createReceivable: async (
      command: CreateReceivableCommand,
    ): Promise<ReceivableRecord> => {
      const response = await client.post(apiContractMap.fiscalReceivablesCreate.path, {
        description: command.description,
        amount: command.amount,
        expected_date: command.expectedDate,
        category: command.category,
      });
      const payload = unwrapEnvelopeData<{ readonly receivable: ReceivablePayload }>(
        response.data,
      );
      return mapReceivable(payload.receivable);
    },
    markReceived: async (
      receivableId: string,
      command: MarkReceivableReceivedCommand,
    ): Promise<ReceivableRecord> => {
      const response = await client.patch(
        apiContractMap.fiscalReceivablesReceive.path.replace(
          "{entryId}",
          receivableId,
        ),
        {
          received_date: command.receivedDate,
          received_amount: command.receivedAmount,
        },
      );
      const payload = unwrapEnvelopeData<{ readonly receivable: ReceivablePayload }>(
        response.data,
      );
      return mapReceivable(payload.receivable);
    },
    deleteReceivable: async (receivableId: string): Promise<ReceivableRecord> => {
      const response = await client.delete(
        apiContractMap.fiscalReceivablesDelete.path.replace(
          "{entryId}",
          receivableId,
        ),
      );
      const payload = unwrapEnvelopeData<{ readonly receivable: ReceivablePayload }>(
        response.data,
      );
      return mapReceivable(payload.receivable);
    },
    getRevenueSummary: async (): Promise<RevenueSummary> => {
      const response = await client.get(apiContractMap.fiscalReceivablesSummary.path);
      const payload = unwrapEnvelopeData<{ readonly summary: RevenueSummary }>(
        response.data,
      );
      return payload.summary;
    },
    listFiscalDocuments: async (
      query: FiscalDocumentListQuery = {},
    ): Promise<FiscalDocumentListResponse> => {
      const response = await client.get(apiContractMap.fiscalDocumentsList.path, {
        params: {
          type: query.type,
        },
      });
      const payload = unwrapEnvelopeData<{
        readonly fiscal_documents: FiscalDocumentPayload[];
        readonly count: number;
      }>(response.data);
      return {
        fiscalDocuments: payload.fiscal_documents.map(mapFiscalDocument),
        count: payload.count,
      };
    },
    createFiscalDocument: async (
      command: CreateFiscalDocumentCommand,
    ): Promise<FiscalDocumentRecord> => {
      const response = await client.post(apiContractMap.fiscalDocumentsCreate.path, {
        type: command.type,
        amount: command.amount,
        issued_at: command.issuedAt,
        counterpart_name: command.counterpartName,
        external_id: command.externalId,
        raw_data: command.rawData,
      });
      const payload = unwrapEnvelopeData<{
        readonly fiscal_document: FiscalDocumentPayload;
      }>(response.data);
      return mapFiscalDocument(payload.fiscal_document);
    },
  };
};

export const fiscalService = createFiscalService(httpClient);
