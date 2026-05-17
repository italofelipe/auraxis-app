import { useQueryClient } from "@tanstack/react-query";

import { createApiMutation } from "@/core/query/create-api-mutation";
import { queryKeys } from "@/core/query/query-keys";
import type {
  ConfirmImportCommand,
  ConfirmImportResult,
  ImportDetectResult,
  ImportFileAsset,
  ImportPreview,
  ImportPreviewCommand,
} from "@/features/import/contracts";
import { importService } from "@/features/import/services/import-service";

export const useDetectImportMutation = () => {
  return createApiMutation<ImportDetectResult, ImportFileAsset>((file) =>
    importService.detectFile(file),
  );
};

export const usePreviewImportMutation = () => {
  return createApiMutation<ImportPreview, ImportPreviewCommand>((command) =>
    importService.previewFile(command),
  );
};

export const useConfirmImportMutation = () => {
  const queryClient = useQueryClient();

  return createApiMutation<ConfirmImportResult, ConfirmImportCommand>(
    (command) => importService.confirmImport(command),
    {
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: queryKeys.transactions.root }),
          queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.root }),
          queryClient.invalidateQueries({ queryKey: queryKeys.import.root }),
        ]);
      },
    },
  );
};
