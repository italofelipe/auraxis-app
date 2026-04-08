import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/core/query/query-keys";
import type {
  CreateFiscalDocumentCommand,
  CreateReceivableCommand,
  CsvConfirmCommand,
  CsvConfirmResponse,
  CsvPreviewCommand,
  CsvPreviewResponse,
  FiscalDocumentRecord,
  MarkReceivableReceivedCommand,
  ReceivableRecord,
} from "@/features/fiscal/contracts";
import { fiscalService } from "@/features/fiscal/services/fiscal-service";

export const useCsvPreviewMutation = () => {
  return useMutation<CsvPreviewResponse, Error, CsvPreviewCommand>({
    mutationFn: (command) => fiscalService.previewCsv(command),
  });
};

export const useConfirmCsvMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<CsvConfirmResponse, Error, CsvConfirmCommand>({
    mutationFn: (command) => fiscalService.confirmCsv(command),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.fiscal.root });
    },
  });
};

export const useCreateReceivableMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<ReceivableRecord, Error, CreateReceivableCommand>({
    mutationFn: (command) => fiscalService.createReceivable(command),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.fiscal.root });
    },
  });
};

export interface MarkReceivableReceivedVariables {
  readonly receivableId: string;
  readonly payload: MarkReceivableReceivedCommand;
}

export const useMarkReceivableReceivedMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<ReceivableRecord, Error, MarkReceivableReceivedVariables>({
    mutationFn: ({ receivableId, payload }) => {
      return fiscalService.markReceived(receivableId, payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.fiscal.root });
    },
  });
};

export const useDeleteReceivableMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<ReceivableRecord, Error, string>({
    mutationFn: (receivableId) => fiscalService.deleteReceivable(receivableId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.fiscal.root });
    },
  });
};

export const useCreateFiscalDocumentMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<FiscalDocumentRecord, Error, CreateFiscalDocumentCommand>({
    mutationFn: (command) => fiscalService.createFiscalDocument(command),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.fiscal.root });
    },
  });
};
