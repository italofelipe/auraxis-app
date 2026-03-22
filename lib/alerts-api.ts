import type { AxiosInstance } from "axios";

import { httpClient } from "@/lib/http-client";
import type { AlertPreference, AlertsResponse } from "@/types/contracts";

interface AlertsApiClient {
  readonly get: AxiosInstance["get"];
  readonly post: AxiosInstance["post"];
  readonly put: AxiosInstance["put"];
  readonly delete: AxiosInstance["delete"];
}

export interface UpdatePreferencePayload {
  readonly enabled: boolean;
  readonly channels: string[];
}

export const createAlertsApi = (client: AlertsApiClient) => {
  return {
    getAlerts: async (): Promise<AlertsResponse> => {
      const response = await client.get<AlertsResponse>("/alerts");
      return response.data;
    },
    markRead: async (id: string): Promise<void> => {
      await client.post(`/alerts/${id}/read`);
    },
    deleteAlert: async (id: string): Promise<void> => {
      await client.delete(`/alerts/${id}`);
    },
    getPreferences: async (): Promise<AlertPreference[]> => {
      const response = await client.get<AlertPreference[]>("/alerts/preferences");
      return response.data;
    },
    updatePreference: async (
      category: string,
      payload: UpdatePreferencePayload,
    ): Promise<AlertPreference> => {
      const response = await client.put<AlertPreference>(
        `/alerts/preferences/${category}`,
        payload,
      );
      return response.data;
    },
  };
};

export const alertsApi = createAlertsApi(httpClient);
