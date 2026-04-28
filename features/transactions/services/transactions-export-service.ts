import type { AxiosInstance } from "axios";

import { httpClient } from "@/core/http/http-client";
import type {
  TransactionExportBlob,
  TransactionExportFilters,
  TransactionExportFormat,
} from "@/features/transactions/contracts";

const MIME_BY_FORMAT: Record<TransactionExportFormat, string> = {
  csv: "text/csv",
  pdf: "application/pdf",
};

const buildFilename = (
  contentDisposition: string | undefined,
  format: TransactionExportFormat,
): string => {
  if (contentDisposition) {
    const match = /filename\*?=(?:UTF-8'')?["']?([^"';\n]+)["']?/i.exec(
      contentDisposition,
    );
    if (match && match[1]) {
      try {
        return decodeURIComponent(match[1].trim());
      } catch {
        return match[1].trim();
      }
    }
  }
  const stamp = new Date().toISOString().slice(0, 10);
  return `auraxis-transactions-${stamp}.${format}`;
};

// eslint-disable-next-line max-statements
const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  // Chunk to avoid stack overflow on very large payloads.
  const chunk = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunk) {
    const slice = bytes.subarray(offset, Math.min(offset + chunk, bytes.length));
    binary += String.fromCharCode(...slice);
  }
  // RN's `btoa` polyfill exists via JavaScriptCore; falls back to manual
  // implementation when absent (older Hermes builds).
  const encode = (globalThis as { btoa?: (input: string) => string }).btoa;
  if (typeof encode === "function") {
    return encode(binary);
  }
  // Manual base64 encode as last resort.
  const alphabet =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let out = "";
  for (let i = 0; i < binary.length; i += 3) {
    const a = binary.charCodeAt(i);
    const b = i + 1 < binary.length ? binary.charCodeAt(i + 1) : 0;
    const c = i + 2 < binary.length ? binary.charCodeAt(i + 2) : 0;
    const triple = (a << 16) | (b << 8) | c;
    out += alphabet[(triple >> 18) & 0x3f];
    out += alphabet[(triple >> 12) & 0x3f];
    out += i + 1 < binary.length ? alphabet[(triple >> 6) & 0x3f] : "=";
    out += i + 2 < binary.length ? alphabet[triple & 0x3f] : "=";
  }
  return out;
};

export const createTransactionsExportService = (client: AxiosInstance) => {
  return {
    download: async (
      filters: TransactionExportFilters,
    ): Promise<TransactionExportBlob> => {
      const response = await client.get<ArrayBuffer>(
        "/transactions/export",
        {
          params: {
            format: filters.format,
            start_date: filters.startDate,
            end_date: filters.endDate,
          },
          responseType: "arraybuffer",
        },
      );

      const filename = buildFilename(
        response.headers?.["content-disposition"] as string | undefined,
        filters.format,
      );
      const contentType =
        (response.headers?.["content-type"] as string | undefined) ??
        MIME_BY_FORMAT[filters.format];

      return {
        base64: arrayBufferToBase64(response.data),
        filename,
        contentType,
      };
    },
  };
};

export const transactionsExportService = createTransactionsExportService(
  httpClient,
);
