import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/core/query/query-keys";
import { alertsService } from "@/features/alerts/services/alerts-service";
import type { Alert, AlertsResponse } from "@/types/contracts";

const mapAlertRecord = (
  alert: Awaited<ReturnType<typeof alertsService.listAlerts>>["alerts"][number],
): Alert => {
  const createdAt = alert.createdAt ?? alert.triggeredAt ?? new Date().toISOString();
  const isRead = alert.status === "read";

  return {
    id: alert.id,
    type: alert.category,
    title: alert.category.replace(/_/gu, " "),
    body: alert.entityType
      ? `Evento relacionado a ${alert.entityType}.`
      : "Nova atualizacao disponivel.",
    severity: isRead ? "info" : "warning",
    read_at: isRead ? alert.sentAt ?? alert.triggeredAt ?? createdAt : null,
    created_at: createdAt,
  };
};

export const useAlertsQuery = () => {
  return useQuery<AlertsResponse>({
    queryKey: queryKeys.alerts.list(),
    queryFn: async (): Promise<AlertsResponse> => {
      const response = await alertsService.listAlerts();

      return {
        items: response.alerts.map(mapAlertRecord),
        total: response.alerts.length,
      };
    },
  });
};
