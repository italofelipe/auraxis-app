import type { AxiosInstance } from "axios";

import { unwrapEnvelopeData } from "@/core/http/contracts";
import { httpClient } from "@/core/http/http-client";
import type {
  ConfirmImportCommand,
  ConfirmImportResult,
  ImportColumnMapping,
  ImportConfidence,
  ImportDetectResult,
  ImportFileAsset,
  ImportFileType,
  ImportMissingField,
  ImportPreview,
  ImportPreviewCommand,
  ImportRejectedRow,
  ImportTransactionDraft,
  ImportTransactionType,
} from "@/features/import/contracts";
import { apiContractMap } from "@/shared/contracts/api-contract-map";

interface ImportDetectPayload {
  readonly file_type: ImportFileType;
  readonly sheet_names?: readonly string[];
  readonly active_sheet?: string | null;
  readonly headers: readonly string[];
  readonly sample_rows: readonly (readonly string[])[];
  readonly suggested_mapping: {
    readonly date_column?: string | null;
    readonly description_column?: string | null;
    readonly amount_column?: string | null;
    readonly type_column?: string | null;
    readonly sheet_name?: string | null;
  };
  readonly confidence: {
    readonly date_column?: number | null;
    readonly description_column?: number | null;
    readonly amount_column?: number | null;
    readonly type_column?: number | null;
  };
}

interface ImportPreviewPayload {
  readonly preview_token: string;
  readonly expires_at: string;
  readonly file_type: ImportFileType;
  readonly total_count: number;
  readonly duplicates_count: number;
  readonly incomplete_count?: number | null;
  readonly transactions: readonly {
    readonly id: string;
    readonly date: string;
    readonly description: string;
    readonly amount: string | number;
    readonly transaction_type: ImportTransactionType;
    readonly category: string | null;
    readonly confidence: number | null;
    readonly is_duplicate: boolean;
    readonly missing_fields?: readonly string[] | null;
  }[];
  readonly rejected_rows?:
    | readonly { readonly line_number: number; readonly reason: string }[]
    | null;
}

interface ConfirmImportPayload {
  readonly imported_count: number;
  readonly skipped_count?: number | null;
  readonly errors?:
    | readonly { readonly draft_id: string; readonly reason: string }[]
    | null;
}

type AppendableFormData = FormData & {
  append: (name: string, value: unknown) => void;
};

const multipartHeaders = {
  "Content-Type": "multipart/form-data",
} as const;

const appendFile = (formData: FormData, file: ImportFileAsset): void => {
  (formData as AppendableFormData).append("file", {
    uri: file.uri,
    name: file.name,
    type: file.mimeType,
  });
};

const toApiMapping = (mapping: ImportColumnMapping): Record<string, string> => {
  const payload: Record<string, string> = {
    date_column: mapping.dateColumn,
    description_column: mapping.descriptionColumn,
    amount_column: mapping.amountColumn,
    type_column: mapping.typeColumn,
  };

  if (mapping.sheetName) {
    payload.sheet_name = mapping.sheetName;
  }

  return payload;
};

const toMapping = (payload: ImportDetectPayload): ImportColumnMapping => ({
  dateColumn: payload.suggested_mapping.date_column ?? "",
  descriptionColumn: payload.suggested_mapping.description_column ?? "",
  amountColumn: payload.suggested_mapping.amount_column ?? "",
  typeColumn: payload.suggested_mapping.type_column ?? "",
  sheetName: payload.suggested_mapping.sheet_name ?? payload.active_sheet ?? null,
});

const toConfidence = (payload: ImportDetectPayload): ImportConfidence => ({
  dateColumn: payload.confidence.date_column ?? 0,
  descriptionColumn: payload.confidence.description_column ?? 0,
  amountColumn: payload.confidence.amount_column ?? 0,
  typeColumn: payload.confidence.type_column ?? 0,
});

const mapDetect = (payload: ImportDetectPayload): ImportDetectResult => ({
  fileType: payload.file_type,
  sheetNames: payload.sheet_names ?? [],
  activeSheet: payload.active_sheet ?? null,
  headers: payload.headers,
  sampleRows: payload.sample_rows,
  suggestedMapping: toMapping(payload),
  confidence: toConfidence(payload),
});

const KNOWN_MISSING_FIELDS: readonly ImportMissingField[] = [
  "description",
  "amount",
];

/**
 * Mantém só os campos que o app sabe perguntar. Um campo novo no backend não
 * pode virar um card de conferência sem formulário — seria uma pendência que o
 * usuário não teria como resolver.
 */
const toMissingFields = (
  raw: readonly string[] | null | undefined,
): readonly ImportMissingField[] => {
  if (!raw) {
    return [];
  }
  return KNOWN_MISSING_FIELDS.filter((field) => raw.includes(field));
};

const mapTransaction = (
  payload: ImportPreviewPayload["transactions"][number],
): ImportTransactionDraft => ({
  id: payload.id,
  date: payload.date,
  description: payload.description,
  amount: String(payload.amount),
  type: payload.transaction_type,
  category: payload.category,
  confidence: payload.confidence,
  isDuplicate: payload.is_duplicate,
  missingFields: toMissingFields(payload.missing_fields),
});

const mapRejectedRow = (payload: {
  readonly line_number: number;
  readonly reason: string;
}): ImportRejectedRow => ({
  lineNumber: payload.line_number,
  reason: payload.reason,
});

const mapPreview = (payload: ImportPreviewPayload): ImportPreview => {
  const transactions = payload.transactions.map(mapTransaction);
  return {
    previewToken: payload.preview_token,
    expiresAt: payload.expires_at,
    fileType: payload.file_type,
    totalCount: payload.total_count,
    duplicatesCount: payload.duplicates_count,
    // O backend manda `incomplete_count`, mas derivar dos drafts mantém a
    // contagem coerente com o que a tela consegue de fato perguntar.
    incompleteCount:
      payload.incomplete_count ??
      transactions.filter((tx) => tx.missingFields.length > 0).length,
    transactions,
    rejectedRows: (payload.rejected_rows ?? []).map(mapRejectedRow),
  };
};

export const createImportService = (client: AxiosInstance) => {
  return {
    detectFile: async (file: ImportFileAsset): Promise<ImportDetectResult> => {
      const formData = new FormData();
      appendFile(formData, file);
      const response = await client.post(
        apiContractMap.importDetect.path,
        formData,
        { headers: multipartHeaders },
      );
      return mapDetect(unwrapEnvelopeData<ImportDetectPayload>(response.data));
    },
    previewFile: async (
      command: ImportPreviewCommand,
    ): Promise<ImportPreview> => {
      const formData = new FormData();
      appendFile(formData, command.file);
      (formData as AppendableFormData).append(
        "mapping",
        JSON.stringify(toApiMapping(command.mapping)),
      );
      const response = await client.post(
        apiContractMap.importPreview.path,
        formData,
        { headers: multipartHeaders },
      );
      return mapPreview(unwrapEnvelopeData<ImportPreviewPayload>(response.data));
    },
    confirmImport: async (
      command: ConfirmImportCommand,
    ): Promise<ConfirmImportResult> => {
      const response = await client.post(apiContractMap.importConfirm.path, {
        preview_token: command.previewToken,
        exclude_ids: command.excludeIds,
        completions: command.completions ?? {},
        use_generic_placeholders: command.useGenericPlaceholders ?? false,
      });
      const payload = unwrapEnvelopeData<ConfirmImportPayload>(response.data);
      return {
        importedCount: payload.imported_count,
        skippedCount: payload.skipped_count ?? command.excludeIds.length,
        errors: (payload.errors ?? []).map((error) => ({
          draftId: error.draft_id,
          reason: error.reason,
        })),
      };
    },
  };
};

export const importService = createImportService(httpClient);
