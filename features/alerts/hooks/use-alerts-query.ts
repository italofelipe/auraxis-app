import { createApiQuery } from "@/core/query/create-api-query";
import type {
  AlertListResponse,
  AlertPreferenceListResponse,
} from "@/features/alerts/contracts";
import { alertsService } from "@/features/alerts/services/alerts-service";

export const useAlertsQuery = (unreadOnly = false) => {
  return createApiQuery<AlertListResponse>(
    ["alerts", unreadOnly],
    () => alertsService.listAlerts(unreadOnly),
  );
};

export const useAlertPreferencesQuery = () => {
  return createApiQuery<AlertPreferenceListResponse>(
    ["alerts", "preferences"],
    () => alertsService.getPreferences(),
  );
};
