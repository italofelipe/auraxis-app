export type AlertSeverity = "info" | "warning" | "critical";

export interface Alert {
  readonly id: string;
  readonly type: string;
  readonly title: string;
  readonly body: string;
  readonly severity: AlertSeverity;
  readonly read_at: string | null;
  readonly created_at: string;
}

export interface AlertPreference {
  readonly id: string;
  readonly category: string;
  readonly enabled: boolean;
  readonly channels: string[];
}

export interface AlertsResponse {
  readonly items: Alert[];
  readonly total: number;
}
