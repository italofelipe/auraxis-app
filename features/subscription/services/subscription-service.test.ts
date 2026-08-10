import type { AxiosInstance } from "axios";

import { createSubscriptionService } from "@/features/subscription/services/subscription-service";
import { apiContractMap } from "@/shared/contracts/api-contract-map";

const createClient = (): jest.Mocked<Pick<AxiosInstance, "get" | "post">> => ({
  get: jest.fn(),
  post: jest.fn(),
});

describe("subscriptionService", () => {
  it("cancela pela rota canonica e mapeia o estado retornado", async () => {
    const client = createClient();
    client.post.mockResolvedValue({
      data: {
        data: {
          subscription: {
            id: "sub-1",
            user_id: "user-1",
            plan_code: "premium",
            offer_code: "premium-monthly",
            status: "canceled",
            billing_cycle: "monthly",
            provider: "asaas",
            provider_subscription_id: "bill-1",
            trial_ends_at: null,
            current_period_start: "2026-07-01T00:00:00Z",
            current_period_end: "2026-08-01T00:00:00Z",
            canceled_at: "2026-07-23T22:00:00Z",
            created_at: "2026-07-01T00:00:00Z",
            updated_at: "2026-07-23T22:00:00Z",
          },
        },
      },
    });

    const service = createSubscriptionService(
      client as unknown as AxiosInstance,
    );
    const result = await service.cancelSubscription();

    expect(client.post).toHaveBeenCalledWith(
      apiContractMap.subscriptionCancel.path,
    );
    expect(result).toEqual({
      id: "sub-1",
      userId: "user-1",
      planCode: "premium",
      offerCode: "premium-monthly",
      status: "canceled",
      billingCycle: "monthly",
      provider: "asaas",
      providerSubscriptionId: "bill-1",
      trialEndsAt: null,
      currentPeriodStart: "2026-07-01T00:00:00Z",
      currentPeriodEnd: "2026-08-01T00:00:00Z",
      canceledAt: "2026-07-23T22:00:00Z",
      createdAt: "2026-07-01T00:00:00Z",
      updatedAt: "2026-07-23T22:00:00Z",
    });
  });
});
