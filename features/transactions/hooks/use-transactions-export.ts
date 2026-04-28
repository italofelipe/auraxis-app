import { useCallback, useState } from "react";

import type {
  TransactionExportBlob,
  TransactionExportFilters,
} from "@/features/transactions/contracts";
import { transactionsExportService } from "@/features/transactions/services/transactions-export-service";
import { shareTransactionsExport } from "@/features/transactions/services/transactions-export-share";
import { triggerHapticNotification } from "@/shared/feedback/haptics";

export interface UseTransactionsExportResult {
  readonly isExporting: boolean;
  readonly error: unknown | null;
  readonly exportNow: (filters: TransactionExportFilters) => Promise<void>;
  readonly dismissError: () => void;
}

/**
 * Imperative hook that downloads the export blob and opens the OS
 * share sheet. Designed to be triggered from a button — it owns its
 * own loading and error state so the caller doesn't have to manage
 * a mutation.
 */
export const useTransactionsExport = (): UseTransactionsExportResult => {
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [error, setError] = useState<unknown | null>(null);

  const exportNow = useCallback(
    async (filters: TransactionExportFilters): Promise<void> => {
      setIsExporting(true);
      setError(null);
      try {
        const blob: TransactionExportBlob = await transactionsExportService.download(
          filters,
        );
        await shareTransactionsExport(blob);
        triggerHapticNotification("success");
      } catch (caught) {
        setError(caught);
        triggerHapticNotification("error");
      } finally {
        setIsExporting(false);
      }
    },
    [],
  );

  return {
    isExporting,
    error,
    exportNow,
    dismissError: () => setError(null),
  };
};
