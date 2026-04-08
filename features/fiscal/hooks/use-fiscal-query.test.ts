import type {
  CreateFiscalDocumentCommand,
  CreateReceivableCommand,
  CsvConfirmCommand,
  CsvPreviewCommand,
  MarkReceivableReceivedCommand,
} from "@/features/fiscal/contracts";
import { queryKeys } from "@/core/query/query-keys";
import {
  useFiscalDocumentsQuery,
  useReceivablesQuery,
  useRevenueSummaryQuery,
} from "@/features/fiscal/hooks/use-fiscal-query";
import {
  useConfirmCsvMutation,
  useCreateFiscalDocumentMutation,
  useCreateReceivableMutation,
  useCsvPreviewMutation,
  useDeleteReceivableMutation,
  useMarkReceivableReceivedMutation,
} from "@/features/fiscal/hooks/use-fiscal-mutations";

const mockCreateApiQuery = jest.fn();
const mockListReceivables = jest.fn();
const mockGetRevenueSummary = jest.fn();
const mockListFiscalDocuments = jest.fn();
const mockPreviewCsv = jest.fn();
const mockConfirmCsv = jest.fn();
const mockCreateReceivable = jest.fn();
const mockMarkReceived = jest.fn();
const mockDeleteReceivable = jest.fn();
const mockCreateFiscalDocument = jest.fn();
const mockUseMutation = jest.fn();
const mockUseQueryClient = jest.fn();
const mockInvalidateQueries = jest.fn();

jest.mock("@/core/query/create-api-query", () => ({
  createApiQuery: (...args: readonly unknown[]) => mockCreateApiQuery(...args),
}));

jest.mock("@tanstack/react-query", () => ({
  useMutation: (...args: readonly unknown[]) => mockUseMutation(...args),
  useQueryClient: () => mockUseQueryClient(),
}));

jest.mock("@/features/fiscal/services/fiscal-service", () => ({
  fiscalService: {
    listReceivables: (...args: readonly unknown[]) => mockListReceivables(...args),
    getRevenueSummary: (...args: readonly unknown[]) => mockGetRevenueSummary(...args),
    listFiscalDocuments: (...args: readonly unknown[]) => mockListFiscalDocuments(...args),
    previewCsv: (...args: readonly unknown[]) => mockPreviewCsv(...args),
    confirmCsv: (...args: readonly unknown[]) => mockConfirmCsv(...args),
    createReceivable: (...args: readonly unknown[]) => mockCreateReceivable(...args),
    markReceived: (...args: readonly unknown[]) => mockMarkReceived(...args),
    deleteReceivable: (...args: readonly unknown[]) => mockDeleteReceivable(...args),
    createFiscalDocument: (...args: readonly unknown[]) => mockCreateFiscalDocument(...args),
  },
}));

describe("fiscal hooks", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateApiQuery.mockImplementation(
      (queryKey: readonly unknown[], queryFn: () => Promise<unknown>) => ({
        queryKey,
        queryFn,
      }),
    );
    mockUseMutation.mockImplementation((options: unknown) => options);
    mockInvalidateQueries.mockResolvedValue(undefined);
    mockUseQueryClient.mockReturnValue({
      invalidateQueries: mockInvalidateQueries,
    });
  });

  it("configura as queries fiscais", async () => {
    mockListReceivables.mockResolvedValue({ receivables: [], count: 0 });
    mockGetRevenueSummary.mockResolvedValue({ pendingTotal: "0.00" });
    mockListFiscalDocuments.mockResolvedValue({ fiscalDocuments: [], count: 0 });

    const receivables = useReceivablesQuery({ status: "pending" }) as unknown as {
      queryKey: readonly unknown[];
      queryFn: () => Promise<unknown>;
    };
    const summary = useRevenueSummaryQuery() as unknown as {
      queryKey: readonly unknown[];
      queryFn: () => Promise<unknown>;
    };
    const documents = useFiscalDocumentsQuery({ type: "nfs-e" }) as unknown as {
      queryKey: readonly unknown[];
      queryFn: () => Promise<unknown>;
    };

    await expect(receivables.queryFn()).resolves.toEqual({ receivables: [], count: 0 });
    await expect(summary.queryFn()).resolves.toEqual({ pendingTotal: "0.00" });
    await expect(documents.queryFn()).resolves.toEqual({ fiscalDocuments: [], count: 0 });
    expect(receivables.queryKey).toEqual([...queryKeys.fiscal.receivables(), { status: "pending" }]);
    expect(summary.queryKey).toEqual(queryKeys.fiscal.summary());
    expect(documents.queryKey).toEqual([...queryKeys.fiscal.documents(), { type: "nfs-e" }]);
  });

  it("configura as mutations fiscais e invalida o dominio quando necessario", async () => {
    const previewCommand: CsvPreviewCommand = { content: "csv" };
    const confirmCommand: CsvConfirmCommand = { content: "csv" };
    const createReceivableCommand: CreateReceivableCommand = {
      description: "Projeto",
      amount: "900.00",
      expectedDate: "2026-04-10",
    };
    const markReceivedCommand: MarkReceivableReceivedCommand = {
      receivedDate: "2026-04-05",
    };
    const createDocumentCommand: CreateFiscalDocumentCommand = {
      type: "nfs-e",
      amount: "500.00",
      issuedAt: "2026-04-06",
    };
    mockPreviewCsv.mockResolvedValue({ preview: [] });
    mockConfirmCsv.mockResolvedValue({ importId: "imp-1" });
    mockCreateReceivable.mockResolvedValue({ id: "rec-1" });
    mockMarkReceived.mockResolvedValue({ id: "rec-1" });
    mockDeleteReceivable.mockResolvedValue({ id: "rec-1" });
    mockCreateFiscalDocument.mockResolvedValue({ id: "doc-1" });

    const preview = useCsvPreviewMutation() as unknown as {
      mutationFn: (input: CsvPreviewCommand) => Promise<unknown>;
    };
    const confirm = useConfirmCsvMutation() as unknown as {
      mutationFn: (input: CsvConfirmCommand) => Promise<unknown>;
      onSuccess: () => Promise<void>;
    };
    const createReceivable = useCreateReceivableMutation() as unknown as {
      mutationFn: (input: CreateReceivableCommand) => Promise<unknown>;
      onSuccess: () => Promise<void>;
    };
    const markReceived = useMarkReceivableReceivedMutation() as unknown as {
      mutationFn: (input: {
        readonly receivableId: string;
        readonly payload: MarkReceivableReceivedCommand;
      }) => Promise<unknown>;
      onSuccess: () => Promise<void>;
    };
    const removeReceivable = useDeleteReceivableMutation() as unknown as {
      mutationFn: (id: string) => Promise<unknown>;
      onSuccess: () => Promise<void>;
    };
    const createDocument = useCreateFiscalDocumentMutation() as unknown as {
      mutationFn: (input: CreateFiscalDocumentCommand) => Promise<unknown>;
      onSuccess: () => Promise<void>;
    };

    await preview.mutationFn(previewCommand);
    await confirm.mutationFn(confirmCommand);
    await createReceivable.mutationFn(createReceivableCommand);
    await markReceived.mutationFn({ receivableId: "rec-1", payload: markReceivedCommand });
    await removeReceivable.mutationFn("rec-1");
    await createDocument.mutationFn(createDocumentCommand);
    await confirm.onSuccess();
    await createReceivable.onSuccess();
    await markReceived.onSuccess();
    await removeReceivable.onSuccess();
    await createDocument.onSuccess();

    expect(mockPreviewCsv).toHaveBeenCalledWith(previewCommand);
    expect(mockConfirmCsv).toHaveBeenCalledWith(confirmCommand);
    expect(mockCreateReceivable).toHaveBeenCalledWith(createReceivableCommand);
    expect(mockMarkReceived).toHaveBeenCalledWith("rec-1", markReceivedCommand);
    expect(mockDeleteReceivable).toHaveBeenCalledWith("rec-1");
    expect(mockCreateFiscalDocument).toHaveBeenCalledWith(createDocumentCommand);
    expect(mockInvalidateQueries).toHaveBeenCalledTimes(5);
    expect(mockInvalidateQueries).toHaveBeenNthCalledWith(1, {
      queryKey: queryKeys.fiscal.root,
    });
  });
});
