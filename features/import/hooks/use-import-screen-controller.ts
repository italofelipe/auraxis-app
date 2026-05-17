import { useMemo, useState } from "react";
import * as DocumentPicker from "expo-document-picker";

import type {
  ConfirmImportResult,
  ImportColumnMapping,
  ImportDetectResult,
  ImportFileAsset,
  ImportMappingFieldKey,
  ImportMappingFieldViewModel,
  ImportPreview,
} from "@/features/import/contracts";
import {
  IMPORT_CONFIDENCE_THRESHOLD,
  IMPORT_SUPPORTED_MIME_TYPES,
} from "@/features/import/import-config";
import {
  useConfirmImportMutation,
  useDetectImportMutation,
  usePreviewImportMutation,
} from "@/features/import/hooks/use-import-mutations";

export type ImportScreenPhase = "select" | "mapping" | "preview" | "success";

export interface ImportScreenController {
  readonly phase: ImportScreenPhase;
  readonly file: ImportFileAsset | null;
  readonly detectResult: ImportDetectResult | null;
  readonly preview: ImportPreview | null;
  readonly currentMappingIndex: number;
  readonly currentMappingField: ImportMappingFieldViewModel | null;
  readonly mappingFields: readonly ImportMappingFieldViewModel[];
  readonly selectedImportCount: number;
  readonly totalPreviewCount: number;
  readonly duplicateCount: number;
  readonly confirmationResult: ConfirmImportResult | null;
  readonly error: unknown | null;
  readonly isBusy: boolean;
  readonly handlePickFile: () => Promise<void>;
  readonly handleCancelMapping: () => void;
  readonly handlePreviousMappingField: () => void;
  readonly handleNextMappingField: () => void;
  readonly handleMappingChange: (field: ImportMappingFieldKey, value: string) => void;
  readonly handleConfirmMapping: () => Promise<void>;
  readonly handleToggleTransaction: (transactionId: string) => void;
  readonly handleConfirmImport: () => Promise<void>;
  readonly handleReset: () => void;
  readonly dismissError: () => void;
  readonly isTransactionSelected: (transactionId: string) => boolean;
}

const FIELD_LABELS: Record<ImportMappingFieldKey, string> = {
  dateColumn: "Coluna de Data",
  descriptionColumn: "Coluna de Descricao",
  amountColumn: "Coluna de Valor",
  typeColumn: "Coluna de Tipo",
};

const FIELD_ORDER: readonly ImportMappingFieldKey[] = [
  "dateColumn",
  "descriptionColumn",
  "amountColumn",
  "typeColumn",
];

const emptyMapping: ImportColumnMapping = {
  dateColumn: "",
  descriptionColumn: "",
  amountColumn: "",
  typeColumn: "",
  sheetName: null,
};

const toAsset = (asset: DocumentPicker.DocumentPickerAsset): ImportFileAsset => ({
  uri: asset.uri,
  name: asset.name,
  mimeType: asset.mimeType ?? resolveMimeTypeFromName(asset.name),
  size: asset.size ?? null,
});

const resolveMimeTypeFromName = (name: string): string => {
  const normalized = name.trim().toLowerCase();
  if (normalized.endsWith(".xlsx")) {
    return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  }
  return "text/csv";
};

const shouldShowMappingField = (
  detectResult: ImportDetectResult,
  mapping: ImportColumnMapping,
  field: ImportMappingFieldKey,
): boolean => {
  return (
    detectResult.confidence[field] < IMPORT_CONFIDENCE_THRESHOLD ||
    mapping[field].trim().length === 0
  );
};

const fieldsRequiringMapping = (
  detectResult: ImportDetectResult,
  mapping: ImportColumnMapping,
): readonly ImportMappingFieldKey[] => {
  return FIELD_ORDER.filter((field) =>
    shouldShowMappingField(detectResult, mapping, field),
  );
};

const sampleValuesForField = (
  detectResult: ImportDetectResult,
  columnName: string,
): readonly string[] => {
  const columnIndex = detectResult.headers.findIndex((header) => header === columnName);
  if (columnIndex < 0) {
    return [];
  }
  return detectResult.sampleRows
    .map((row) => String(row[columnIndex] ?? ""))
    .filter((value) => value.trim().length > 0)
    .slice(0, 3);
};

const buildMappingFields = (
  detectResult: ImportDetectResult | null,
  mapping: ImportColumnMapping,
): readonly ImportMappingFieldViewModel[] => {
  if (!detectResult) {
    return [];
  }
  const fields = fieldsRequiringMapping(detectResult, mapping);

  return fields.map((field) => ({
    key: field,
    label: FIELD_LABELS[field],
    value: mapping[field],
    confidence: detectResult.confidence[field],
    sampleValues: sampleValuesForField(detectResult, mapping[field]),
  }));
};

// eslint-disable-next-line max-lines-per-function, max-statements
export function useImportScreenController(): ImportScreenController {
  const detectMutation = useDetectImportMutation();
  const previewMutation = usePreviewImportMutation();
  const confirmMutation = useConfirmImportMutation();
  const [phase, setPhase] = useState<ImportScreenPhase>("select");
  const [file, setFile] = useState<ImportFileAsset | null>(null);
  const [detectResult, setDetectResult] = useState<ImportDetectResult | null>(null);
  const [mapping, setMapping] = useState<ImportColumnMapping>(emptyMapping);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(new Set());
  const [currentMappingIndex, setCurrentMappingIndex] = useState<number>(0);
  const [confirmationResult, setConfirmationResult] =
    useState<ConfirmImportResult | null>(null);
  const [error, setError] = useState<unknown | null>(null);

  const mappingFields = useMemo(
    () => buildMappingFields(detectResult, mapping),
    [detectResult, mapping],
  );
  const currentMappingField = mappingFields[currentMappingIndex] ?? null;
  const totalPreviewCount = preview?.transactions.length ?? 0;
  const duplicateCount = preview?.duplicatesCount ?? 0;

  const handlePickFile = async (): Promise<void> => {
    setError(null);
    const result = await DocumentPicker.getDocumentAsync({
      type: [...IMPORT_SUPPORTED_MIME_TYPES],
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (result.canceled || !result.assets[0]) {
      return;
    }

    const selectedFile = toAsset(result.assets[0]);
    setFile(selectedFile);
    try {
      const detected = await detectMutation.mutateAsync(selectedFile);
      const nextMapping = detected.suggestedMapping;
      setDetectResult(detected);
      setMapping(nextMapping);
      setCurrentMappingIndex(0);
      if (fieldsRequiringMapping(detected, nextMapping).length > 0) {
        setPhase("mapping");
        return;
      }
      await generatePreview(selectedFile, nextMapping);
    } catch (caughtError) {
      setError(caughtError);
    }
  };

  const generatePreview = async (
    selectedFile: ImportFileAsset | null,
    selectedMapping: ImportColumnMapping,
  ): Promise<void> => {
    if (!selectedFile) {
      return;
    }
    setError(null);
    try {
      const nextPreview = await previewMutation.mutateAsync({
        file: selectedFile,
        mapping: selectedMapping,
      });
      setPreview(nextPreview);
      setSelectedIds(
        new Set(
          nextPreview.transactions
            .filter((transaction) => !transaction.isDuplicate)
            .map((transaction) => transaction.id),
        ),
      );
      setPhase("preview");
    } catch (caughtError) {
      setError(caughtError);
    }
  };

  const handleConfirmMapping = async (): Promise<void> => {
    await generatePreview(file, mapping);
  };

  const handleConfirmImport = async (): Promise<void> => {
    if (!preview) {
      return;
    }
    setError(null);
    const excludeIds = preview.transactions
      .filter((transaction) => !selectedIds.has(transaction.id))
      .map((transaction) => transaction.id);
    try {
      const result = await confirmMutation.mutateAsync({
        previewToken: preview.previewToken,
        excludeIds,
      });
      setConfirmationResult(result);
      setPhase("success");
    } catch (caughtError) {
      setError(caughtError);
    }
  };

  return {
    phase,
    file,
    detectResult,
    preview,
    currentMappingIndex,
    currentMappingField,
    mappingFields,
    selectedImportCount: selectedIds.size,
    totalPreviewCount,
    duplicateCount,
    confirmationResult,
    error,
    isBusy:
      detectMutation.isPending || previewMutation.isPending || confirmMutation.isPending,
    handlePickFile,
    handleCancelMapping: () => setPhase("select"),
    handlePreviousMappingField: () => {
      setCurrentMappingIndex((index) => Math.max(0, index - 1));
    },
    handleNextMappingField: () => {
      setCurrentMappingIndex((index) =>
        Math.min(mappingFields.length - 1, index + 1),
      );
    },
    handleMappingChange: (field, value) => {
      setMapping((current) => ({ ...current, [field]: value }));
    },
    handleConfirmMapping,
    handleToggleTransaction: (transactionId) => {
      setSelectedIds((current) => {
        const next = new Set(current);
        if (next.has(transactionId)) {
          next.delete(transactionId);
        } else {
          next.add(transactionId);
        }
        return next;
      });
    },
    handleConfirmImport,
    handleReset: () => {
      setPhase("select");
      setFile(null);
      setDetectResult(null);
      setMapping(emptyMapping);
      setPreview(null);
      setSelectedIds(new Set());
      setCurrentMappingIndex(0);
      setConfirmationResult(null);
      setError(null);
      detectMutation.reset();
      previewMutation.reset();
      confirmMutation.reset();
    },
    dismissError: () => setError(null),
    isTransactionSelected: (transactionId) => selectedIds.has(transactionId),
  };
}
