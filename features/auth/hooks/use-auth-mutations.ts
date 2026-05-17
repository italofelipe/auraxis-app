import { createApiMutation } from "@/core/query/create-api-mutation";
import { useAnalytics } from "@/core/observability/use-analytics";
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
  const analytics = useAnalytics();
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
      analytics.identify(session.user.id, {
        emailConfirmed: session.user.emailConfirmed,
      });
      analytics.capture("auth.login.success", {
        method: "password",
        emailConfirmed: session.user.emailConfirmed,
      });
    },
  });
};

export const useLogoutMutation = () => {
  const analytics = useAnalytics();
  const signOut = useSessionStore((state) => state.signOut);

  return createApiMutation<void, void>(() => authService.logout(), {
    onSettled: async () => {
      analytics.capture("auth.logout", {
        reason: "manual",
      });
      analytics.reset();
      await signOut();
    },
  });
};

export const useRegisterMutation = () => {
  const analytics = useAnalytics();

  return createApiMutation<AuthActionResult, RegisterCommand>(
    authService.register,
    {
      onSuccess: () => {
        analytics.capture("auth.register.completed", {
          emailConfirmed: false,
        });
      },
    },
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
