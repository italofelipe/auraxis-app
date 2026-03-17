import type { AxiosInstance } from "axios";

import { httpClient } from "@/lib/http-client";
import type {
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  LoginRequest,
  LoginResponse,
} from "@/types/contracts";

interface AuthApiClient {
  readonly post: AxiosInstance["post"];
}

interface ForgotPasswordLegacyResponse {
  readonly message: string;
}

type ForgotPasswordWireResponse =
  | ForgotPasswordResponse
  | ForgotPasswordLegacyResponse;

/**
 * Normaliza a resposta de recuperação de senha para o contrato usado pelo app.
 * @param payload Payload legado ou já normalizado.
 * @returns Resposta compatível com o contrato mobile.
 */
const normalizeForgotPasswordResponse = (
  payload: ForgotPasswordWireResponse,
): ForgotPasswordResponse => {
  return {
    accepted: "accepted" in payload ? payload.accepted : true,
    message: payload.message,
  };
};

export const createAuthApi = (client: AuthApiClient) => {
  return {
    login: async (payload: LoginRequest): Promise<LoginResponse> => {
      const response = await client.post<LoginResponse>("/auth/login", payload);
      return response.data;
    },
    forgotPassword: async (
      payload: ForgotPasswordRequest,
    ): Promise<ForgotPasswordResponse> => {
      const response = await client.post<ForgotPasswordWireResponse>(
        "/auth/password/forgot",
        payload,
      );
      return normalizeForgotPasswordResponse(response.data);
    },
  };
};

export const authApi = createAuthApi(httpClient);
