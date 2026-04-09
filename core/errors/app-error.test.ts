import { ApiError } from "@/core/http/api-error";
import { createAppErrorState } from "@/core/errors/app-error";

describe("createAppErrorState", () => {
  it("classifica erros de validacao e reaproveita a mensagem da API", () => {
    const state = createAppErrorState(
      new ApiError({
        message: "Credenciais invalidas.",
        status: 422,
        code: "VALIDATION_ERROR",
      }),
    );

    expect(state).toMatchObject({
      category: "validation",
      recoverability: "dismiss",
      title: "Revise os dados informados",
      description: "Credenciais invalidas.",
      canRetry: false,
      actionLabel: null,
    });
  });

  it("classifica erros offline como network sem CTA de retry", () => {
    const state = createAppErrorState(
      new ApiError({
        message: "Network Error",
        status: 0,
      }),
      {
        connectivityStatus: "offline",
      },
    );

    expect(state).toMatchObject({
      category: "network",
      recoverability: "wait",
      canRetry: false,
      actionLabel: null,
    });
  });

  it("classifica indisponibilidade temporaria como degraded com retry", () => {
    const state = createAppErrorState(
      new ApiError({
        message: "Service unavailable",
        status: 503,
        code: "REQUEST_FAILED",
      }),
    );

    expect(state).toMatchObject({
      category: "degraded",
      recoverability: "retry",
      canRetry: true,
      actionLabel: "Tentar novamente",
      captureInTelemetry: true,
    });
  });

  it("aceita copy customizada quando o fluxo precisa contextualizar a falha", () => {
    const state = createAppErrorState(new Error("Boom"), {
      fallbackTitle: "Nao foi possivel abrir o dashboard",
      fallbackDescription: "Recarregue a tela para tentar novamente.",
    });

    expect(state).toMatchObject({
      category: "unexpected",
      title: "Nao foi possivel abrir o dashboard",
      description: "Recarregue a tela para tentar novamente.",
    });
  });
});
