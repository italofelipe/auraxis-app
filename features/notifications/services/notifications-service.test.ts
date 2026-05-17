import type { AxiosInstance } from "axios";

import { createNotificationsService } from "@/features/notifications/services/notifications-service";

const createClient = (): jest.Mocked<Pick<AxiosInstance, "post">> => ({
  post: jest.fn(),
});

describe("notificationsService", () => {
  it("registra token Expo no contrato /notifications/subscribe", async () => {
    const client = createClient();
    client.post.mockResolvedValue({
      data: {
        data: {
          id: "sub-1",
          transport: "expo",
          endpoint: "ExponentPushToken[test]",
          device_label: "iPhone 15",
        },
      },
    });

    const service = createNotificationsService(client as unknown as AxiosInstance);
    const result = await service.subscribe({
      transport: "expo",
      endpoint: "ExponentPushToken[test]",
      deviceLabel: "iPhone 15",
    });

    expect(client.post).toHaveBeenCalledWith("/notifications/subscribe", {
      transport: "expo",
      endpoint: "ExponentPushToken[test]",
      device_label: "iPhone 15",
      expiration_time: undefined,
      keys: undefined,
    });
    expect(result).toEqual({
      id: "sub-1",
      transport: "expo",
      endpoint: "ExponentPushToken[test]",
      deviceLabel: "iPhone 15",
    });
  });

  it("remove token registrado pelo endpoint", async () => {
    const client = createClient();
    client.post.mockResolvedValue({ data: { data: {} } });

    const service = createNotificationsService(client as unknown as AxiosInstance);
    await service.unsubscribe({ endpoint: "ExponentPushToken[test]" });

    expect(client.post).toHaveBeenCalledWith("/notifications/unsubscribe", {
      endpoint: "ExponentPushToken[test]",
    });
  });
});
