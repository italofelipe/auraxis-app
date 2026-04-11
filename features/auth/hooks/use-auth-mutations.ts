import { createApiMutation } from "@/core/query/create-api-mutation";
import { useSessionStore } from "@/core/session/session-store";
import type {
  AuthActionResult,
  AuthSession,
  ConfirmEmailCommand,
  ForgotPasswordCommand,
  LoginCommand,
  RegisterCommand,
  ResetPasswordCommand,
} from "@/features/auth/contracts";
import { authService } from "@/features/auth/services/auth-service";

export const useLoginMutation = () => {
  const signIn = useSessionStore((state) => state.signIn);

  return createApiMutation<AuthSession, LoginCommand>(authService.login, {
    onSuccess: async (session) => {
      await signIn({
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
        user: {
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
          emailConfirmed: session.user.emailConfirmed,
        },
      });
    },
  });
};

export const useLogoutMutation = () => {
  const signOut = useSessionStore((state) => state.signOut);

  return createApiMutation<void, void>(() => authService.logout(), {
    onSettled: async () => {
      await signOut();
    },
  });
};

export const useRegisterMutation = () => {
  return createApiMutation<AuthActionResult, RegisterCommand>(
    authService.register,
  );
};

export const useForgotPasswordMutation = () => {
  return createApiMutation<AuthActionResult, ForgotPasswordCommand>(
    authService.forgotPassword,
  );
};

export const useResetPasswordMutation = () => {
  return createApiMutation<AuthActionResult, ResetPasswordCommand>(
    authService.resetPassword,
  );
};

export const useConfirmEmailMutation = () => {
  return createApiMutation<AuthActionResult, ConfirmEmailCommand>(
    authService.confirmEmail,
  );
};

export const useResendConfirmationMutation = () => {
  return createApiMutation<AuthActionResult, void>(() =>
    authService.resendConfirmationEmail(),
  );
};
