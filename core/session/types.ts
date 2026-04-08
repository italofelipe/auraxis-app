export interface SessionUser {
  readonly id: string | null;
  readonly name: string | null;
  readonly email: string;
  readonly emailConfirmed: boolean;
}

export interface SessionSeed {
  readonly accessToken: string;
  readonly refreshToken: string | null;
  readonly user: SessionUser;
  readonly authenticatedAt?: string | null;
  readonly expiresAt?: string | null;
}

export type SessionInvalidationReason =
  | "manual"
  | "expired"
  | "unauthorized"
  | "forbidden"
  | "bootstrap-invalid";

export interface StoredSession extends SessionSeed {
  readonly authenticatedAt: string | null;
  readonly expiresAt: string | null;
}
