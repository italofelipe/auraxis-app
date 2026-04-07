export interface SessionUser {
  readonly id: string | null;
  readonly name: string | null;
  readonly email: string;
  readonly emailConfirmed: boolean;
}

export interface StoredSession {
  readonly accessToken: string;
  readonly refreshToken: string | null;
  readonly user: SessionUser;
}
