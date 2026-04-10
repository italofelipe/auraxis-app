import { APP_EVENT_LOGGING_POLICY } from "@/core/telemetry/logging-policy";

describe("logging policy", () => {
  it("mantem todos os eventos mapeados com nivel, descricao e contexto minimo", () => {
    expect(APP_EVENT_LOGGING_POLICY["startup.bootstrap_requested"]).toEqual({
      level: "info",
      description: "Início do bootstrap estrutural do app.",
      minimumContextKeys: ["hydrated"],
      consolePolicy: "dev-only",
    });
    expect(APP_EVENT_LOGGING_POLICY["network.request_failed"]).toEqual({
      level: "warn",
      description: "Requisição HTTP falhou no cliente.",
      minimumContextKeys: ["method", "path", "status", "code"],
      consolePolicy: "warn-and-error",
    });
    expect(APP_EVENT_LOGGING_POLICY["runtime.error_boundary_captured"]).toEqual({
      level: "error",
      description: "Erro inesperado capturado por boundary de React.",
      minimumContextKeys: ["scope", "componentStack"],
      consolePolicy: "warn-and-error",
    });
  });

  it("nao deixa eventos sem contexto minimo declarado", () => {
    expect(
      Object.values(APP_EVENT_LOGGING_POLICY).every((policy) => {
        return policy.minimumContextKeys.length > 0;
      }),
    ).toBe(true);
  });
});
