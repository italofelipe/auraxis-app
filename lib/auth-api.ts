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

export const createAuthApi = (client: AuthApiClient) => {
  return {
    login: async (payload: LoginRequest): Promise<LoginResponse> => {
      const response = await client.post<LoginResponse>("/auth/login", payload);
      return response.data;
    },
    forgotPassword: async (
      payload: ForgotPasswordRequest,
    ): Promise<ForgotPasswordResponse> => {
      const response = await client.post<ForgotPasswordResponse>(
        "/auth/forgot-password",
        payload,
      );
      return response.data;
    },
  };
};

export const authApi = createAuthApi(httpClient);
