import type { AxiosInstance } from "axios";

import { unwrapEnvelopeData } from "@/core/http/contracts";
import { httpClient } from "@/core/http/http-client";
import type {
  PushSubscriptionCommand,
  PushSubscriptionRecord,
  PushUnsubscribeCommand,
} from "@/features/notifications/contracts";
import { apiContractMap } from "@/shared/contracts/api-contract-map";

interface PushSubscriptionPayload {
  readonly id: string;
  readonly transport: PushSubscriptionRecord["transport"];
  readonly endpoint: string;
  readonly device_label?: string | null;
}

const mapPushSubscription = (
  payload: PushSubscriptionPayload,
): PushSubscriptionRecord => ({
  id: payload.id,
  transport: payload.transport,
  endpoint: payload.endpoint,
  deviceLabel: payload.device_label ?? null,
});

const buildSubscribePayload = (
  command: PushSubscriptionCommand,
): Record<string, unknown> => ({
  transport: command.transport,
  endpoint: command.endpoint,
  device_label: command.deviceLabel ?? undefined,
  expiration_time: command.expirationTime ?? undefined,
  keys: command.keys ?? undefined,
});

export const createNotificationsService = (client: AxiosInstance) => ({
  subscribe: async (
    command: PushSubscriptionCommand,
  ): Promise<PushSubscriptionRecord> => {
    const response = await client.post(
      apiContractMap.notificationsSubscribe.path,
      buildSubscribePayload(command),
    );
    const payload = unwrapEnvelopeData<PushSubscriptionPayload>(response.data);
    return mapPushSubscription(payload);
  },
  unsubscribe: async (command: PushUnsubscribeCommand): Promise<void> => {
    await client.post(apiContractMap.notificationsUnsubscribe.path, {
      endpoint: command.endpoint,
    });
  },
});

export const notificationsService = createNotificationsService(httpClient);
