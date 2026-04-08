import type { AxiosInstance } from "axios";

import {
  createFiscalService,
} from "@/features/fiscal/services/fiscal-service";

const createClient = (): jest.Mocked<
  Pick<AxiosInstance, "get" | "post" | "patch" | "delete">
> => {
  return {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  };
};

describe("fiscalService", () => {
  it("gera preview e confirma importacao de CSV", async () => {
    const client = createClient();
    client.post
      .mockResolvedValueOnce({
        data: {
          data: {
            preview: [
              {
                description: "NF Abril",
                amount: "1200.00",
                date: "2026-04-01",
                category: "services",
                externalId: "nf-1",
              },
            ],
            total_rows: 1,
            valid_rows: 1,
            error_rows: 0,
            errors: [],
          },
        },
      })
      .mockResolvedValueOnce({
        data: {
          data: {
            import_id: "imp-1",
            imported_count: 1,
            skipped_duplicates: 0,
            error_rows: 0,
            errors: [],
          },
        },
      });

    const service = createFiscalService(client as unknown as AxiosInstance);
    const preview = await service.previewCsv({ content: "csv-content" });
    const confirm = await service.confirmCsv({
      content: "csv-content",
      filename: "abril.csv",
    });

    expect(client.post).toHaveBeenNthCalledWith(1, "/fiscal/csv/upload", {
      content: "csv-content",
      column_map: undefined,
    });
    expect(client.post).toHaveBeenNthCalledWith(2, "/fiscal/csv/confirm", {
      content: "csv-content",
      column_map: undefined,
      filename: "abril.csv",
    });
    expect(preview.totalRows).toBe(1);
    expect(confirm.importId).toBe("imp-1");
  });

  it("lista, cria, recebe e remove recebiveis", async () => {
    const client = createClient();
    client.get.mockResolvedValueOnce({
      data: {
        data: {
          receivables: [
            {
              id: "rec-1",
              fiscal_document_id: "doc-1",
              expected_net_amount: "1000.00",
              received_amount: null,
              outstanding_amount: "1000.00",
              reconciliation_status: "pending",
              received_at: null,
              created_at: "2026-04-01T10:00:00",
              disclaimer: "Estimativa",
            },
          ],
          count: 1,
        },
      },
    });
    client.post.mockResolvedValueOnce({
      data: {
        data: {
          receivable: {
            id: "rec-2",
            fiscal_document_id: "doc-2",
            expected_net_amount: "900.00",
            received_amount: null,
            outstanding_amount: "900.00",
            reconciliation_status: "pending",
            received_at: null,
            created_at: "2026-04-01T10:00:00",
            disclaimer: "Estimativa",
          },
        },
      },
    });
    client.patch.mockResolvedValueOnce({
      data: {
        data: {
          receivable: {
            id: "rec-2",
            fiscal_document_id: "doc-2",
            expected_net_amount: "900.00",
            received_amount: "900.00",
            outstanding_amount: "0.00",
            reconciliation_status: "received",
            received_at: "2026-04-05",
            created_at: "2026-04-01T10:00:00",
            disclaimer: "Estimativa",
          },
        },
      },
    });
    client.delete.mockResolvedValueOnce({
      data: {
        data: {
          receivable: {
            id: "rec-3",
            fiscal_document_id: "doc-3",
            expected_net_amount: "300.00",
            received_amount: null,
            outstanding_amount: "300.00",
            reconciliation_status: "cancelled",
            received_at: null,
            created_at: "2026-04-01T10:00:00",
            disclaimer: "Estimativa",
          },
        },
      },
    });

    const service = createFiscalService(client as unknown as AxiosInstance);
    const list = await service.listReceivables({ status: "pending" });
    const created = await service.createReceivable({
      description: "Projeto",
      amount: "900.00",
      expectedDate: "2026-04-10",
    });
    const received = await service.markReceived("rec-2", {
      receivedDate: "2026-04-05",
      receivedAmount: "900.00",
    });
    const deleted = await service.deleteReceivable("rec-3");

    expect(client.get).toHaveBeenCalledWith("/fiscal/receivables", {
      params: { status: "pending" },
    });
    expect(client.post).toHaveBeenCalledWith("/fiscal/receivables", {
      description: "Projeto",
      amount: "900.00",
      expected_date: "2026-04-10",
      category: undefined,
    });
    expect(client.patch).toHaveBeenCalledWith("/fiscal/receivables/rec-2/receive", {
      received_date: "2026-04-05",
      received_amount: "900.00",
    });
    expect(client.delete).toHaveBeenCalledWith("/fiscal/receivables/rec-3");
    expect(list.count).toBe(1);
    expect(created.id).toBe("rec-2");
    expect(received.reconciliationStatus).toBe("received");
    expect(deleted.reconciliationStatus).toBe("cancelled");
  });

  it("carrega resumo de receitas e documentos fiscais", async () => {
    const client = createClient();
    client.get
      .mockResolvedValueOnce({
        data: {
          data: {
            summary: {
              expectedTotal: "1500.00",
              receivedTotal: "900.00",
              pendingTotal: "600.00",
              disclaimer: "Estimativa",
            },
          },
        },
      })
      .mockResolvedValueOnce({
        data: {
          data: {
            fiscal_documents: [
              {
                id: "doc-1",
                external_id: "nf-1",
                type: "nfs-e",
                status: "issued",
                issued_at: "2026-04-02",
                counterparty: "Cliente X",
                gross_amount: "1500.00",
                currency: "BRL",
                description: "Servico",
                created_at: "2026-04-02T10:00:00",
              },
            ],
            count: 1,
          },
        },
      });
    client.post.mockResolvedValueOnce({
      data: {
        data: {
          fiscal_document: {
            id: "doc-2",
            external_id: "nf-2",
            type: "nfs-e",
            status: "draft",
            issued_at: "2026-04-03",
            counterparty: "Cliente Y",
            gross_amount: "600.00",
            currency: "BRL",
            description: "Consultoria",
            created_at: "2026-04-03T10:00:00",
          },
        },
      },
    });

    const service = createFiscalService(client as unknown as AxiosInstance);
    const summary = await service.getRevenueSummary();
    const documents = await service.listFiscalDocuments({ type: "nfs-e" });
    const created = await service.createFiscalDocument({
      type: "nfs-e",
      amount: "600.00",
      issuedAt: "2026-04-03",
      counterpartName: "Cliente Y",
      externalId: "nf-2",
    });

    expect(client.get).toHaveBeenNthCalledWith(1, "/fiscal/receivables/summary");
    expect(client.get).toHaveBeenNthCalledWith(2, "/fiscal/fiscal-documents", {
      params: { type: "nfs-e" },
    });
    expect(client.post).toHaveBeenCalledWith("/fiscal/fiscal-documents", {
      type: "nfs-e",
      amount: "600.00",
      issued_at: "2026-04-03",
      counterpart_name: "Cliente Y",
      external_id: "nf-2",
      raw_data: undefined,
    });
    expect(summary.pendingTotal).toBe("600.00");
    expect(documents.count).toBe(1);
    expect(created.id).toBe("doc-2");
  });
});
