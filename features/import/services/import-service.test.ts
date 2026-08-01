import type { AxiosInstance } from "axios";

import type {
  ImportColumnMapping,
  ImportFileAsset,
} from "@/features/import/contracts";
import { createImportService } from "@/features/import/services/import-service";

const buildClient = () =>
  ({
    post: jest.fn(),
  }) as unknown as AxiosInstance & { post: jest.Mock };

const file: ImportFileAsset = {
  uri: "file:///cache/extrato.csv",
  name: "extrato.csv",
  mimeType: "text/csv",
};

const mapping: ImportColumnMapping = {
  dateColumn: "Data",
  descriptionColumn: "Descricao",
  amountColumn: "Valor",
  typeColumn: "Tipo",
  sheetName: "Janeiro",
};

describe("createImportService.detectFile", () => {
  it("detectFile envia multipart para /v2/import/detect e normaliza a resposta", async () => {
    const client = buildClient();
    client.post.mockResolvedValueOnce({
      data: {
        data: {
          file_type: "csv",
          sheet_names: ["Janeiro"],
          active_sheet: "Janeiro",
          headers: ["Data", "Descricao", "Valor", "Tipo"],
          sample_rows: [["2026-05-01", "Uber", "25,50", "saida"]],
          suggested_mapping: {
            date_column: "Data",
            description_column: "Descricao",
            amount_column: "Valor",
            type_column: "Tipo",
          },
          confidence: {
            date_column: 0.95,
            description_column: 0.65,
            amount_column: 0.9,
            type_column: 0.8,
          },
        },
      },
    });

    const result = await createImportService(client).detectFile(file);

    expect(client.post).toHaveBeenCalledWith(
      "/v2/import/detect",
      expect.any(FormData),
      expect.objectContaining({
        headers: expect.objectContaining({ "Content-Type": "multipart/form-data" }),
      }),
    );
    expect(result).toEqual({
      fileType: "csv",
      sheetNames: ["Janeiro"],
      activeSheet: "Janeiro",
      headers: ["Data", "Descricao", "Valor", "Tipo"],
      sampleRows: [["2026-05-01", "Uber", "25,50", "saida"]],
      suggestedMapping: {
        dateColumn: "Data",
        descriptionColumn: "Descricao",
        amountColumn: "Valor",
        typeColumn: "Tipo",
        sheetName: "Janeiro",
      },
      confidence: {
        dateColumn: 0.95,
        descriptionColumn: 0.65,
        amountColumn: 0.9,
        typeColumn: 0.8,
      },
    });
  });
});

describe("createImportService.previewFile", () => {
  it("previewFile envia arquivo e mapping confirmado e desnormaliza transacoes", async () => {
    const client = buildClient();
    client.post.mockResolvedValueOnce({
      data: {
        data: {
          preview_token: "preview-1",
          expires_at: "2026-05-17T14:00:00Z",
          file_type: "xlsx",
          total_count: 2,
          duplicates_count: 1,
          transactions: [
            {
              id: "draft-1",
              date: "2026-05-01",
              description: "Uber",
              amount: "25.50",
              transaction_type: "expense",
              category: "transporte",
              confidence: 0.92,
              is_duplicate: false,
            },
            {
              id: "draft-2",
              date: "2026-05-02",
              description: "Salario",
              amount: "5000.00",
              transaction_type: "income",
              category: "receita",
              confidence: null,
              is_duplicate: true,
            },
          ],
        },
      },
    });

    const result = await createImportService(client).previewFile({
      file,
      mapping,
    });

    expect(client.post).toHaveBeenCalledWith(
      "/v2/import/preview",
      expect.any(FormData),
      expect.objectContaining({
        headers: expect.objectContaining({ "Content-Type": "multipart/form-data" }),
      }),
    );
    expect(result.transactions).toEqual([
      {
        id: "draft-1",
        date: "2026-05-01",
        description: "Uber",
        amount: "25.50",
        type: "expense",
        category: "transporte",
        confidence: 0.92,
        isDuplicate: false,
        missingFields: [],
      },
      {
        id: "draft-2",
        date: "2026-05-02",
        description: "Salario",
        amount: "5000.00",
        type: "income",
        category: "receita",
        confidence: null,
        isDuplicate: true,
        missingFields: [],
      },
    ]);
    expect(result.previewToken).toBe("preview-1");
    expect(result.duplicatesCount).toBe(1);
  });
});

describe("createImportService.confirmImport", () => {
  it("confirmImport envia preview_token e exclude_ids em snake_case", async () => {
    const client = buildClient();
    client.post.mockResolvedValueOnce({
      data: {
        data: {
          imported_count: 1,
          skipped_count: 1,
        },
      },
    });

    const result = await createImportService(client).confirmImport({
      previewToken: "preview-1",
      excludeIds: ["draft-2"],
    });

    expect(client.post).toHaveBeenCalledWith("/v2/import/confirm", {
      preview_token: "preview-1",
      exclude_ids: ["draft-2"],
      completions: {},
      use_generic_placeholders: false,
    });
    expect(result).toEqual({ importedCount: 1, skippedCount: 1, errors: [] });
  });
});

describe("createImportService — campos do fluxo de conferência", () => {
  it("mapeia missing_fields, rejected_rows e incomplete_count do preview", async () => {
    const client = buildClient();
    client.post.mockResolvedValueOnce({
      data: {
        data: {
          preview_token: "preview-1",
          expires_at: "2026-05-17T14:00:00Z",
          file_type: "csv",
          total_count: 2,
          duplicates_count: 0,
          incomplete_count: 1,
          transactions: [
            {
              id: "draft-1",
              date: "2026-05-01",
              description: "",
              amount: "25.50",
              transaction_type: "expense",
              category: null,
              confidence: null,
              is_duplicate: false,
              missing_fields: ["description"],
            },
          ],
          rejected_rows: [{ line_number: 9, reason: "Data invalida" }],
        },
      },
    });

    const result = await createImportService(client).previewFile({ file, mapping });

    expect(result.transactions[0]?.missingFields).toEqual(["description"]);
    expect(result.incompleteCount).toBe(1);
    expect(result.rejectedRows).toEqual([{ lineNumber: 9, reason: "Data invalida" }]);
  });

  it("descarta campo faltante que a tela nao sabe perguntar", async () => {
    const client = buildClient();
    client.post.mockResolvedValueOnce({
      data: {
        data: {
          preview_token: "preview-1",
          expires_at: "2026-05-17T14:00:00Z",
          file_type: "csv",
          total_count: 1,
          duplicates_count: 0,
          transactions: [
            {
              id: "draft-1",
              date: "2026-05-01",
              description: "Uber",
              amount: "25.50",
              transaction_type: "expense",
              category: null,
              confidence: null,
              is_duplicate: false,
              // Campo novo no backend: viraria pendencia sem formulario.
              missing_fields: ["description", "installments"],
            },
          ],
        },
      },
    });

    const result = await createImportService(client).previewFile({ file, mapping });

    expect(result.transactions[0]?.missingFields).toEqual(["description"]);
  });

  it("deriva incomplete_count dos drafts quando o backend omite o campo", async () => {
    const client = buildClient();
    client.post.mockResolvedValueOnce({
      data: {
        data: {
          preview_token: "preview-1",
          expires_at: "2026-05-17T14:00:00Z",
          file_type: "csv",
          total_count: 2,
          duplicates_count: 0,
          transactions: [
            {
              id: "draft-1", date: "2026-05-01", description: "", amount: "25.50",
              transaction_type: "expense", category: null, confidence: null,
              is_duplicate: false, missing_fields: ["description"],
            },
            {
              id: "draft-2", date: "2026-05-02", description: "Uber", amount: "10.00",
              transaction_type: "expense", category: null, confidence: null,
              is_duplicate: false,
            },
          ],
        },
      },
    });

    const result = await createImportService(client).previewFile({ file, mapping });

    expect(result.incompleteCount).toBe(1);
    expect(result.rejectedRows).toEqual([]);
    expect(result.transactions[1]?.missingFields).toEqual([]);
  });

  it("envia completions e use_generic_placeholders no confirm", async () => {
    const client = buildClient();
    client.post.mockResolvedValueOnce({
      data: { data: { imported_count: 2, skipped_count: 0 } },
    });

    await createImportService(client).confirmImport({
      previewToken: "preview-1",
      excludeIds: [],
      completions: { "draft-1": { description: "Mercado" } },
      useGenericPlaceholders: true,
    });

    expect(client.post).toHaveBeenCalledWith("/v2/import/confirm", {
      preview_token: "preview-1",
      exclude_ids: [],
      completions: { "draft-1": { description: "Mercado" } },
      use_generic_placeholders: true,
    });
  });

  it("mapeia os erros por linha devolvidos pelo confirm", async () => {
    const client = buildClient();
    client.post.mockResolvedValueOnce({
      data: {
        data: {
          imported_count: 1,
          skipped_count: 0,
          errors: [{ draft_id: "draft-9", reason: "valor invalido" }],
        },
      },
    });

    const result = await createImportService(client).confirmImport({
      previewToken: "preview-1",
      excludeIds: [],
    });

    expect(result.errors).toEqual([{ draftId: "draft-9", reason: "valor invalido" }]);
  });
});
