import type { AxiosInstance } from "axios";

import { unwrapEnvelopeData } from "@/core/http/contracts";
import { httpClient } from "@/core/http/http-client";
import type {
  AuthActionResult,
  AuthSession,
  ConfirmEmailCommand,
  ForgotPasswordCommand,
  LoginCommand,
  RegisterCommand,
  ResetPasswordCommand,
} from "@/features/auth/contracts";

interface LoginPayload {
  readonly token: string;
  readonly refresh_token?: string | null;
  readonly user: {
    readonly id: string;
    readonly name: string;
    readonly email: string;
    readonly email_confirmed?: boolean;
  };
}

interface RegisterPayload {
  readonly name: string;
  readonly email: string;
  readonly password: string;
  readonly captcha_token?: string;
}

const buildRegisterPayload = (command: RegisterCommand): RegisterPayload => {
  if (command.captchaToken) {
    return {
      name: command.name,
      email: command.email,
      password: command.password,
      captcha_token: command.captchaToken,
    };
  }

  return {
    name: command.name,
    email: command.email,
    password: command.password,
  };
};

const resolveActionMessage = (
  payload: unknown,
  fallbackMessage: string,
): string => {
  if (
    payload &&
    typeof payload === "object" &&
    "message" in payload &&
    typeof payload.message === "string"
  ) {
    return payload.message;
  }

  return fallbackMessage;
};

const mapLoginPayload = (payload: LoginPayload): AuthSession => {
  return {
    accessToken: payload.token,
    refreshToken: payload.refresh_token ?? null,
    user: {
      id: payload.user.id,
      name: payload.user.name,
      email: payload.user.email,
      emailConfirmed: payload.user.email_confirmed === true,
    },
  };
};

export const createAuthService = (client: AxiosInstance) => {
  return {
    login: async (command: LoginCommand): Promise<AuthSession> => {
      const response = await client.post("/auth/login", {
        email: command.email,
        password: command.password,
        captcha_token: command.captchaToken,
      });

      return mapLoginPayload(unwrapEnvelopeData<LoginPayload>(response.data));
    },
    register: async (command: RegisterCommand): Promise<AuthActionResult> => {
      const response = await client.post(
        "/auth/register",
        buildRegisterPayload(command),
      );
      return {
        accepted: true,
        message: resolveActionMessage(
          response.data,
          "Cadastro realizado com sucesso.",
        ),
      };
    },
    logout: async (): Promise<void> => {
      await client.post("/auth/logout");
    },
    forgotPassword: async (
      command: ForgotPasswordCommand,
    ): Promise<AuthActionResult> => {
      const response = await client.post("/auth/password/forgot", {
        email: command.email,
      });

      return {
        accepted: true,
        message: resolveActionMessage(response.data, "Solicitacao recebida."),
      };
    },
    resetPassword: async (
      command: ResetPasswordCommand,
    ): Promise<AuthActionResult> => {
      const response = await client.post("/auth/password/reset", {
        token: command.token,
        password: command.password,
      });

      return {
        accepted: true,
        message: resolveActionMessage(
          response.data,
          "Senha redefinida com sucesso.",
        ),
      };
    },
    confirmEmail: async (
      command: ConfirmEmailCommand,
    ): Promise<AuthActionResult> => {
      const response = await client.post("/auth/email/confirm", {
        token: command.token,
      });

      return {
        accepted: true,
        message: resolveActionMessage(
          response.data,
          "Conta confirmada com sucesso.",
        ),
      };
    },
    resendConfirmationEmail: async (): Promise<AuthActionResult> => {
      const response = await client.post("/auth/email/resend");
      return {
        accepted: true,
        message: resolveActionMessage(
          response.data,
          "Confirmacao reenviada com sucesso.",
        ),
      };
    },
  };
};

export const authService = createAuthService(httpClient);
