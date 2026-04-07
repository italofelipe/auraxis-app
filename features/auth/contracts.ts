export interface AuthUser {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly emailConfirmed: boolean;
}

export interface LoginCommand {
  readonly email: string;
  readonly password: string;
  readonly captchaToken?: string;
}

export interface RegisterCommand {
  readonly name: string;
  readonly email: string;
  readonly password: string;
  readonly captchaToken?: string;
}

export interface ConfirmEmailCommand {
  readonly token: string;
}

export interface ForgotPasswordCommand {
  readonly email: string;
}

export interface ResetPasswordCommand {
  readonly token: string;
  readonly password: string;
}

export interface AuthActionResult {
  readonly accepted: boolean;
  readonly message: string;
}

export interface AuthSession {
  readonly accessToken: string;
  readonly refreshToken: string | null;
  readonly user: AuthUser;
}
