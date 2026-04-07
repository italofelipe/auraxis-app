import type {
  AuthActionResult,
  AuthSession,
  AuthUser,
} from "@/features/auth/contracts";

export const authUserFixture: AuthUser = {
  id: "a6b9a8d2-7d50-47f5-954e-fc8cbb5825aa",
  name: "Italo Chagas",
  email: "italo@auraxis.com.br",
  emailConfirmed: true,
};

export const authSessionFixture: AuthSession = {
  accessToken: "mock-access-token",
  refreshToken: "mock-refresh-token",
  user: authUserFixture,
};

export const authActionFixture: AuthActionResult = {
  accepted: true,
  message: "Solicitacao recebida com sucesso.",
};
