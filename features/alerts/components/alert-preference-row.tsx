import type { ReactElement } from "react";

import type { AlertPreferenceRecord } from "@/features/alerts/contracts";
import { AppToggleRow } from "@/shared/components/app-toggle-row";

export interface AlertPreferenceRowProps {
  readonly preference: AlertPreferenceRecord;
  readonly onToggle: (payload: {
    category: string;
    enabled: boolean;
    globalOptOut: boolean;
  }) => void;
}

/**
 * Canonical preference row for alert settings.
 *
 * @param props Preference payload and change handler injected by the screen controller.
 * @returns A themed toggle row for alert preferences.
 */
export function AlertPreferenceRow({
  preference,
  onToggle,
}: AlertPreferenceRowProps): ReactElement {
  return (
    <AppToggleRow
      label={preference.category}
      description="Canal principal: email"
      checked={preference.enabled}
      testID={`alert-preference-${preference.id}`}
      onCheckedChange={(enabled) => {
        onToggle({
          category: preference.category,
          enabled,
          globalOptOut: preference.globalOptOut,
        });
      }}
    />
  );
}
