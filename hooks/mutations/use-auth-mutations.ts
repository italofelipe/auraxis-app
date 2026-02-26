import { useMutation } from "@tanstack/react-query";

import { authApi } from "@/lib/auth-api";
import { useSessionStore } from "@/stores/session-store";
import type {
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  LoginRequest,
  LoginResponse,
} from "@/types/contracts";

export const useLoginMutation = () => {
  const signIn = useSessionStore((state) => state.signIn);

  return useMutation<LoginResponse, Error, LoginRequest>({
    mutationFn: authApi.login,
    onSuccess: async (response) => {
      await signIn(response.accessToken, response.user.email);
    },
  });
};

export const useForgotPasswordMutation = () => {
  return useMutation<ForgotPasswordResponse, Error, ForgotPasswordRequest>({
    mutationFn: authApi.forgotPassword,
  });
};
