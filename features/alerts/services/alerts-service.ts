import type { AxiosInstance } from "axios";

import { unwrapEnvelopeData } from "@/core/http/contracts";
import { httpClient } from "@/core/http/http-client";
import type {
  AlertListResponse,
  AlertPreferenceListResponse,
  AlertPreferenceRecord,
  AlertPreferenceUpdate,
} from "@/features/alerts/contracts";
import { apiContractMap } from "@/shared/contracts/api-contract-map";

interface AlertPayload {
  readonly id: string;
  readonly user_id: string;
  readonly category: string;
  readonly status: string | null;
  readonly entity_type: string | null;
  readonly entity_id: string | null;
  readonly triggered_at: string | null;
  readonly sent_at: string | null;
  readonly created_at: string | null;
}

interface PreferencePayload {
  readonly id: string;
  readonly user_id: string;
  readonly category: string;
  readonly enabled: boolean;
  readonly global_opt_out: boolean;
  readonly updated_at: string | null;
}

const mapAlert = (payload: AlertPayload): AlertListResponse["alerts"][number] => {
  return {
    id: payload.id,
    userId: payload.user_id,
    category: payload.category,
    status: payload.status,
    entityType: payload.entity_type,
    entityId: payload.entity_id,
    triggeredAt: payload.triggered_at,
    sentAt: payload.sent_at,
    createdAt: payload.created_at,
  };
};

const mapPreference = (payload: PreferencePayload): AlertPreferenceRecord => {
  return {
    id: payload.id,
    userId: payload.user_id,
    category: payload.category,
    enabled: payload.enabled,
    globalOptOut: payload.global_opt_out,
    updatedAt: payload.updated_at,
  };
};

export const createAlertsService = (client: AxiosInstance) => {
  return {
    listAlerts: async (unreadOnly = false): Promise<AlertListResponse> => {
      const response = await client.get(apiContractMap.alertsList.path, {
        params: {
          unread_only: unreadOnly,
        },
      });
      const payload = unwrapEnvelopeData<{ readonly alerts: AlertPayload[] }>(
        response.data,
      );

      return {
        alerts: payload.alerts.map(mapAlert),
      };
    },
    getPreferences: async (): Promise<AlertPreferenceListResponse> => {
      const response = await client.get(apiContractMap.alertPreferences.path);
      const payload = unwrapEnvelopeData<{
        readonly preferences: PreferencePayload[];
      }>(response.data);

      return {
        preferences: payload.preferences.map(mapPreference),
      };
    },
    markRead: async (alertId: string): Promise<void> => {
      await client.post(`/alerts/${alertId}/read`);
    },
    deleteAlert: async (alertId: string): Promise<void> => {
      await client.delete(`/alerts/${alertId}`);
    },
    updatePreference: async (
      category: string,
      command: AlertPreferenceUpdate,
    ): Promise<AlertPreferenceRecord> => {
      const response = await client.put(
        apiContractMap.updateAlertPreference.path.replace("{category}", category),
        {
        enabled: command.enabled,
        channels: command.channels,
        global_opt_out: command.globalOptOut,
        },
      );

      const payload = unwrapEnvelopeData<{ readonly preference: PreferencePayload }>(
        response.data,
      );
      return mapPreference(payload.preference);
    },
  };
};

export const alertsService = createAlertsService(httpClient);
