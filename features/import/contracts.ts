export type ImportFileType = "csv" | "xlsx";
export type ImportTransactionType = "income" | "expense";

export interface ImportFileAsset {
  readonly uri: string;
  readonly name: string;
  readonly mimeType: string;
  readonly size?: number | null;
}

export interface ImportColumnMapping {
  readonly dateColumn: string;
  readonly descriptionColumn: string;
  readonly amountColumn: string;
  readonly typeColumn: string;
  readonly sheetName?: string | null;
}

export interface ImportConfidence {
  readonly dateColumn: number;
  readonly descriptionColumn: number;
  readonly amountColumn: number;
  readonly typeColumn: number;
}

export interface ImportDetectResult {
  readonly fileType: ImportFileType;
  readonly sheetNames: readonly string[];
  readonly activeSheet: string | null;
  readonly headers: readonly string[];
  readonly sampleRows: readonly (readonly string[])[];
  readonly suggestedMapping: ImportColumnMapping;
  readonly confidence: ImportConfidence;
}

export interface ImportPreviewCommand {
  readonly file: ImportFileAsset;
  readonly mapping: ImportColumnMapping;
}

export interface ImportTransactionDraft {
  readonly id: string;
  readonly date: string;
  readonly description: string;
  readonly amount: string;
  readonly type: ImportTransactionType;
  readonly category: string | null;
  readonly confidence: number | null;
  readonly isDuplicate: boolean;
}

export interface ImportPreview {
  readonly previewToken: string;
  readonly expiresAt: string;
  readonly fileType: ImportFileType;
  readonly totalCount: number;
  readonly duplicatesCount: number;
  readonly transactions: readonly ImportTransactionDraft[];
}

export interface ConfirmImportCommand {
  readonly previewToken: string;
  readonly excludeIds: readonly string[];
}

export interface ConfirmImportResult {
  readonly importedCount: number;
  readonly skippedCount: number;
}

export type ImportMappingFieldKey =
  | "dateColumn"
  | "descriptionColumn"
  | "amountColumn"
  | "typeColumn";

export interface ImportMappingFieldViewModel {
  readonly key: ImportMappingFieldKey;
  readonly label: string;
  readonly value: string;
  readonly confidence: number;
  readonly sampleValues: readonly string[];
}
