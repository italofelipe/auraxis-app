import { authService } from "@/features/auth/services/auth-service";
import type {
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  LoginRequest,
  LoginResponse,
} from "@/types/contracts";

interface AuthApiService {
  readonly login: typeof authService.login;
  readonly forgotPassword: typeof authService.forgotPassword;
}

export const createAuthApi = (service: AuthApiService = authService) => {
  return {
    login: async (payload: LoginRequest): Promise<LoginResponse> => {
      const session = await service.login(payload);
      return {
        accessToken: session.accessToken,
        user: {
          email: session.user.email,
          displayName: session.user.name,
        },
      };
    },
    forgotPassword: async (
      payload: ForgotPasswordRequest,
    ): Promise<ForgotPasswordResponse> => {
      const result = await service.forgotPassword(payload);
      return {
        accepted: result.accepted,
        message: result.message,
      };
    },
  };
};

export const authApi = createAuthApi();
