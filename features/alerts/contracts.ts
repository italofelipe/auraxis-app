export interface AlertRecord {
  readonly id: string;
  readonly userId: string;
  readonly category: string;
  readonly status: string | null;
  readonly entityType: string | null;
  readonly entityId: string | null;
  readonly triggeredAt: string | null;
  readonly sentAt: string | null;
  readonly createdAt: string | null;
}

export interface AlertPreferenceRecord {
  readonly id: string;
  readonly userId: string;
  readonly category: string;
  readonly enabled: boolean;
  readonly globalOptOut: boolean;
  readonly updatedAt: string | null;
}

export interface AlertListResponse {
  readonly alerts: AlertRecord[];
}

export interface AlertPreferenceListResponse {
  readonly preferences: AlertPreferenceRecord[];
}

export interface AlertPreferenceUpdate {
  readonly enabled: boolean;
  readonly channels: string[];
  readonly globalOptOut: boolean;
}

export type AlertItem = AlertRecord;
export type AlertPreference = AlertPreferenceRecord;
export type UpdateAlertPreferenceCommand = AlertPreferenceUpdate;
