import { createApiQuery } from "@/core/query/create-api-query";
import { queryKeys } from "@/core/query/query-keys";
import type {
  FiscalDocumentListQuery,
  FiscalDocumentListResponse,
  ReceivableListQuery,
  ReceivableListResponse,
  RevenueSummary,
} from "@/features/fiscal/contracts";
import { fiscalService } from "@/features/fiscal/services/fiscal-service";

export const useReceivablesQuery = (query: ReceivableListQuery = {}) => {
  return createApiQuery<ReceivableListResponse>(
    [...queryKeys.fiscal.receivables(), query],
    () => fiscalService.listReceivables(query),
  );
};

export const useRevenueSummaryQuery = () => {
  return createApiQuery<RevenueSummary>(queryKeys.fiscal.summary(), () =>
    fiscalService.getRevenueSummary(),
  );
};

export const useFiscalDocumentsQuery = (
  query: FiscalDocumentListQuery = {},
) => {
  return createApiQuery<FiscalDocumentListResponse>(
    [...queryKeys.fiscal.documents(), query],
    () => fiscalService.listFiscalDocuments(query),
  );
};
