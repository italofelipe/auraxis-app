import { createApiQuery } from "@/core/query/create-api-query";
import { queryKeys } from "@/core/query/query-keys";
import type {
  AlertListResponse,
  AlertPreferenceListResponse,
} from "@/features/alerts/contracts";
import { alertsService } from "@/features/alerts/services/alerts-service";

export const useAlertsQuery = (unreadOnly = false) => {
  return createApiQuery<AlertListResponse>(
    [...queryKeys.alerts.list(), unreadOnly],
    () => alertsService.listAlerts(unreadOnly),
  );
};

export const useAlertPreferencesQuery = () => {
  return createApiQuery<AlertPreferenceListResponse>(
    queryKeys.alerts.preferences(),
    () => alertsService.getPreferences(),
  );
};
