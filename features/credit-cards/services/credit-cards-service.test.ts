import type { AxiosInstance } from "axios";

import { createCreditCardsService } from "@/features/credit-cards/services/credit-cards-service";

const buildClient = () =>
  ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  }) as unknown as jest.Mocked<AxiosInstance>;

describe("creditCardsService CRUD", () => {
  it("mapeia campos estendidos da listagem", async () => {
    const client = buildClient();
    client.get.mockResolvedValueOnce({
      data: {
        data: {
          credit_cards: [
            {
              id: "card-1",
              name: "Nubank Ultravioleta",
              brand: "mastercard",
              limit_amount: "5000.50",
              closing_day: 10,
              due_day: 20,
              last_four_digits: "1234",
              bank: "Nubank",
              description: "Cartao principal",
              benefits: ["Cashback"],
              validity_date: "2029-12-01",
              created_at: "2026-05-01T00:00:00Z",
              updated_at: "2026-05-02T00:00:00Z",
            },
          ],
        },
      },
    });

    const result = await createCreditCardsService(client).listCreditCards();

    expect(result.creditCards[0]).toMatchObject({
      id: "card-1",
      limitAmount: 5000.5,
      bank: "Nubank",
      benefits: ["Cashback"],
      validityDate: "2029-12-01",
    });
  });

  it("envia campos estendidos no create", async () => {
    const client = buildClient();
    client.post.mockResolvedValueOnce({
      data: {
        data: {
          credit_card: {
            id: "card-1",
            name: "Visa Infinite",
            brand: "visa",
            limit_amount: 10000,
            closing_day: 8,
            due_day: 18,
            last_four_digits: "9876",
            bank: "Itau",
            description: null,
            benefits: ["Milhas"],
            validity_date: "2030-01-01",
            created_at: null,
            updated_at: null,
          },
        },
      },
    });

    await createCreditCardsService(client).createCreditCard({
      name: "Visa Infinite",
      brand: "visa",
      bank: "Itau",
      benefits: ["Milhas"],
      validityDate: "2030-01-01",
    });

    expect(client.post).toHaveBeenCalledWith(
      "/credit-cards",
      expect.objectContaining({
        bank: "Itau",
        benefits: ["Milhas"],
        validity_date: "2030-01-01",
      }),
    );
  });

  it("envia update para o cartao selecionado", async () => {
    const client = buildClient();
    client.put.mockResolvedValueOnce({
      data: {
        data: {
          credit_card: {
            id: "card-1",
            name: "Cartao atualizado",
            brand: null,
            limit_amount: null,
            closing_day: null,
            due_day: null,
            last_four_digits: null,
            bank: null,
            description: null,
            benefits: null,
            validity_date: null,
            created_at: null,
            updated_at: null,
          },
        },
      },
    });

    const result = await createCreditCardsService(client).updateCreditCard({
      creditCardId: "card-1",
      name: "Cartao atualizado",
      description: "Uso familiar",
    });

    expect(client.put).toHaveBeenCalledWith(
      "/credit-cards/card-1",
      expect.objectContaining({
        name: "Cartao atualizado",
        description: "Uso familiar",
      }),
    );
    expect(result).toMatchObject({
      id: "card-1",
      limitAmount: null,
      benefits: [],
    });
  });

  it("remove cartao pelo endpoint de detalhe", async () => {
    const client = buildClient();
    client.delete.mockResolvedValueOnce({ data: {} });

    await createCreditCardsService(client).deleteCreditCard("card-1");

    expect(client.delete).toHaveBeenCalledWith("/credit-cards/card-1");
  });
});

describe("creditCardsService bill and utilization", () => {
  it("carrega fatura com month e normaliza valores monetarios", async () => {
    const client = buildClient();
    client.get.mockResolvedValueOnce({
      data: {
        data: {
          cycle: {
            start_date: "2026-04-11",
            end_date: "2026-05-10",
            due_date: "2026-05-20",
            status: "open",
          },
          transactions: [
            {
              id: "tx-1",
              title: "Mercado",
              amount: "250.75",
              due_date: "2026-05-20",
              status: "pending",
              type: "expense",
            },
          ],
          total_amount: "250.75",
          paid_amount: "0",
          pending_amount: "250.75",
        },
      },
    });

    const result = await createCreditCardsService(client).getBill("card-1", {
      month: "2026-05",
    });

    expect(client.get).toHaveBeenCalledWith("/credit-cards/card-1/bill", {
      params: { month: "2026-05" },
    });
    expect(result).toMatchObject({
      totalAmount: 250.75,
      pendingAmount: 250.75,
      transactions: [{ amount: 250.75, dueDate: "2026-05-20" }],
    });
  });

  it("carrega utilizacao do ciclo aberto", async () => {
    const client = buildClient();
    client.get.mockResolvedValueOnce({
      data: {
        data: {
          cycle: {
            start_date: "2026-04-11",
            end_date: "2026-05-10",
            due_date: "2026-05-20",
            status: "open",
          },
          committed_amount: "3250",
          available_amount: "1750",
          limit_amount: "5000",
          utilization_pct: 65,
        },
      },
    });

    const result = await createCreditCardsService(client).getUtilization("card-1");

    expect(client.get).toHaveBeenCalledWith("/credit-cards/card-1/utilization");
    expect(result).toMatchObject({
      committedAmount: 3250,
      availableAmount: 1750,
      limitAmount: 5000,
      utilizationPct: 65,
    });
  });
});
