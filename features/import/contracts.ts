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

/**
 * Campo que o arquivo não trouxe e que precisa da resposta do usuário antes de
 * concluir a importação. Espelha `missing_fields` do api-v2 (#110).
 */
export type ImportMissingField = "description" | "amount";

export interface ImportTransactionDraft {
  readonly id: string;
  readonly date: string;
  readonly description: string;
  readonly amount: string;
  readonly type: ImportTransactionType;
  readonly category: string | null;
  readonly confidence: number | null;
  readonly isDuplicate: boolean;
  readonly missingFields: readonly ImportMissingField[];
}

/** Linha que existia no arquivo e o parser não conseguiu ler. */
export interface ImportRejectedRow {
  readonly lineNumber: number;
  readonly reason: string;
}

export interface ImportPreview {
  readonly previewToken: string;
  readonly expiresAt: string;
  readonly fileType: ImportFileType;
  readonly totalCount: number;
  readonly duplicatesCount: number;
  readonly incompleteCount: number;
  readonly transactions: readonly ImportTransactionDraft[];
  readonly rejectedRows: readonly ImportRejectedRow[];
}

/** O que o usuário respondeu na conferência: `{ draftId: { campo: valor } }`. */
export type ImportCompletions = Readonly<
  Record<string, Readonly<Partial<Record<ImportMissingField, string>>>>
>;

export interface ConfirmImportCommand {
  readonly previewToken: string;
  readonly excludeIds: readonly string[];
  readonly completions?: ImportCompletions;
  /** "Terminar depois": grava títulos genéricos numerados e R$ 1,00. */
  readonly useGenericPlaceholders?: boolean;
}

/** Linha que o v1 recusou; volta para o cliente poder tentar de novo. */
export interface ImportRowError {
  readonly draftId: string;
  readonly reason: string;
}

export interface ConfirmImportResult {
  readonly importedCount: number;
  readonly skippedCount: number;
  readonly errors: readonly ImportRowError[];
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
