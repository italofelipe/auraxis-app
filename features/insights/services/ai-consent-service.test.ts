import { createAiConsentService } from "@/features/insights/services/ai-consent-service";

const createClient = () => ({
  get: jest.fn(),
  post: jest.fn(),
});

describe("aiConsentService", () => {
  it("carrega o estado mais recente de consentimento da API", async () => {
    const client = createClient();
    client.get.mockResolvedValue({
      data: {
        data: {
          items: [
            {
              id: "consent-1",
              kind: "ai",
              version: "1.0",
              action: "granted",
              source: "app",
              created_at: "2026-07-24T20:00:00Z",
            },
          ],
          total: 1,
        },
      },
    });

    await expect(createAiConsentService(client as never).load()).resolves.toEqual({
      hasConsent: true,
      grantedAt: "2026-07-24T20:00:00Z",
    });
    expect(client.get).toHaveBeenCalledWith("/me/consents");
  });

  it("trata ausência ou revogação como consentimento não concedido", async () => {
    const client = createClient();
    client.get.mockResolvedValue({
      data: {
        items: [
          {
            id: "consent-2",
            kind: "ai",
            version: "1.0",
            action: "revoked",
            source: "app",
            created_at: "2026-07-24T21:00:00Z",
          },
        ],
        total: 1,
      },
    });

    await expect(createAiConsentService(client as never).load()).resolves.toEqual({
      hasConsent: false,
      grantedAt: null,
    });
  });

  it("registra consentimento com source app e contrato 1.0", async () => {
    const client = createClient();
    client.post.mockResolvedValue({
      data: {
        data: {
          id: "consent-3",
          kind: "ai",
          version: "1.0",
          action: "granted",
          source: "app",
          created_at: "2026-07-24T22:00:00Z",
        },
      },
    });

    await expect(createAiConsentService(client as never).grant()).resolves.toEqual({
      hasConsent: true,
      grantedAt: "2026-07-24T22:00:00Z",
    });
    expect(client.post).toHaveBeenCalledWith("/me/consents", {
      kind: "ai",
      version: "1.0",
      action: "granted",
      source: "app",
    });
  });
});
