import type { AxiosInstance } from "axios";

import { createTransactionsExportService } from "@/features/transactions/services/transactions-export-service";

const buildClient = (
  response: { data: ArrayBuffer; headers?: Record<string, string> },
): AxiosInstance => {
  return {
    get: jest.fn().mockResolvedValue(response),
  } as unknown as AxiosInstance;
};

const textBuffer = (text: string): ArrayBuffer => {
  const bytes = new Uint8Array(text.length);
  for (let i = 0; i < text.length; i += 1) {
    bytes[i] = text.charCodeAt(i);
  }
  return bytes.buffer;
};

describe("transactions-export-service", () => {
  it("encodes the payload as base64 and resolves filename + content type", async () => {
    const buffer = textBuffer("hello,world");
    const service = createTransactionsExportService(
      buildClient({
        data: buffer,
        headers: {
          "content-disposition": "attachment; filename=\"transactions.csv\"",
          "content-type": "text/csv",
        },
      }),
    );

    const result = await service.download({ format: "csv" });

    expect(result.filename).toBe("transactions.csv");
    expect(result.contentType).toBe("text/csv");
    // base64 of "hello,world" → "aGVsbG8sd29ybGQ="
    expect(result.base64).toBe("aGVsbG8sd29ybGQ=");
  });

  it("falls back to default filename when content-disposition is missing", async () => {
    const service = createTransactionsExportService(
      buildClient({
        data: textBuffer("PDF"),
      }),
    );
    const result = await service.download({ format: "pdf" });
    expect(result.filename).toMatch(/^auraxis-transactions-\d{4}-\d{2}-\d{2}\.pdf$/);
    expect(result.contentType).toBe("application/pdf");
  });

  it("forwards filters as snake_case query params", async () => {
    const get = jest.fn().mockResolvedValue({
      data: textBuffer("csv"),
      headers: {},
    });
    const service = createTransactionsExportService({ get } as unknown as AxiosInstance);
    await service.download({
      format: "csv",
      startDate: "2026-01-01",
      endDate: "2026-01-31",
    });
    expect(get).toHaveBeenCalledWith(
      "/transactions/export",
      expect.objectContaining({
        params: { format: "csv", start_date: "2026-01-01", end_date: "2026-01-31" },
        responseType: "arraybuffer",
      }),
    );
  });
});
