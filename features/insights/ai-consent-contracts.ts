export interface AiConsentRecord {
  readonly id: string;
  readonly kind: string;
  readonly version: string;
  readonly action: string;
  readonly source: string;
  readonly created_at: string;
}

export interface AiConsentListResponse {
  readonly items: readonly AiConsentRecord[];
  readonly total: number;
}

export interface GrantAiConsentCommand {
  readonly kind: "ai";
  readonly version: "1.0";
  readonly action: "granted";
  readonly source: "app";
}
