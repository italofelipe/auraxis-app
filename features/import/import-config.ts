export const IMPORT_FEATURE_FLAG_KEY = "app.import.csv-xlsx";

export const IMPORT_SUPPORTED_MIME_TYPES = [
  "text/csv",
  "text/comma-separated-values",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
] as const;

export const IMPORT_CONFIDENCE_THRESHOLD = 0.7;
