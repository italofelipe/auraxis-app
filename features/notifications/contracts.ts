export type PushTransport = "expo" | "web_push";

export interface PushSubscriptionKeys {
  readonly p256dh: string;
  readonly auth: string;
}

export interface PushSubscriptionCommand {
  readonly transport: PushTransport;
  readonly endpoint: string;
  readonly deviceLabel?: string | null;
  readonly expirationTime?: string | null;
  readonly keys?: PushSubscriptionKeys | null;
}

export interface PushSubscriptionRecord {
  readonly id: string;
  readonly transport: PushTransport;
  readonly endpoint: string;
  readonly deviceLabel: string | null;
}

export interface PushUnsubscribeCommand {
  readonly endpoint: string;
}

export type PushRegistrationStatus =
  | "unregistered"
  | "registered"
  | "permission-denied"
  | "unavailable"
  | "error";
