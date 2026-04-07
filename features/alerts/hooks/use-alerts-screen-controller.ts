import { useMemo, useState } from "react";

import {
  useAlertPreferencesQuery,
  useAlertsQuery,
} from "@/features/alerts/hooks/use-alerts-query";
import {
  useDeleteAlertMutation,
  useMarkAlertReadMutation,
  useUpdateAlertPreferenceMutation,
} from "@/features/alerts/hooks/use-alerts-mutations";

export type AlertsTabKey = "alerts" | "preferences";

export interface AlertsScreenController {
  readonly activeTab: AlertsTabKey;
  readonly alertsQuery: ReturnType<typeof useAlertsQuery>;
  readonly preferencesQuery: ReturnType<typeof useAlertPreferencesQuery>;
  readonly markReadMutation: ReturnType<typeof useMarkAlertReadMutation>;
  readonly deleteAlertMutation: ReturnType<typeof useDeleteAlertMutation>;
  readonly updatePreferenceMutation: ReturnType<typeof useUpdateAlertPreferenceMutation>;
  readonly setActiveTab: (tab: AlertsTabKey) => void;
}

/**
 * Creates the canonical controller for the alerts screen.
 *
 * @returns View-only bindings for alerts feed and preferences.
 */
export function useAlertsScreenController(): AlertsScreenController {
  const [activeTab, setActiveTab] = useState<AlertsTabKey>("alerts");
  const alertsQuery = useAlertsQuery();
  const preferencesQuery = useAlertPreferencesQuery();
  const markReadMutation = useMarkAlertReadMutation();
  const deleteAlertMutation = useDeleteAlertMutation();
  const updatePreferenceMutation = useUpdateAlertPreferenceMutation();

  return useMemo(
    () => ({
      activeTab,
      alertsQuery,
      preferencesQuery,
      markReadMutation,
      deleteAlertMutation,
      updatePreferenceMutation,
      setActiveTab,
    }),
    [
      activeTab,
      alertsQuery,
      preferencesQuery,
      markReadMutation,
      deleteAlertMutation,
      updatePreferenceMutation,
    ],
  );
}
