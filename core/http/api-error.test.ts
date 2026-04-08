import { AxiosError, type InternalAxiosRequestConfig } from "axios";

import { ApiError, toApiError } from "@/core/http/api-error";

const createConfig = (): InternalAxiosRequestConfig => {
  return {
    headers: {},
    method: "get",
    url: "/dashboard",
  } as InternalAxiosRequestConfig;
};

describe("toApiError", () => {
  it("retorna a mesma instância quando o erro já é ApiError", () => {
    const error = new ApiError({
      message: "Falha",
      status: 400,
    });

    expect(toApiError(error)).toBe(error);
  });

  it("converte payload de erro da API preservando message, code e details", () => {
    const config = createConfig();
    const source = new AxiosError(
      "Request failed",
      "ERR_BAD_REQUEST",
      config,
      undefined,
      {
        data: {
          error: {
            message: "Sessao expirada.",
            code: "SESSION_EXPIRED",
            details: {
              retryable: false,
            },
          },
        },
        status: 401,
        statusText: "Unauthorized",
        headers: {},
        config,
      },
    );

    expect(toApiError(source)).toMatchObject({
      message: "Sessao expirada.",
      status: 401,
      code: "SESSION_EXPIRED",
      details: {
        retryable: false,
      },
      payload: {
        error: {
          message: "Sessao expirada.",
          code: "SESSION_EXPIRED",
          details: {
            retryable: false,
          },
        },
      },
    });
  });

  it("sanitiza erros Axios sem response para nao vazar config interna", () => {
    const source = new AxiosError(
      "Network Error",
      "ERR_NETWORK",
      createConfig(),
    );

    expect(toApiError(source)).toMatchObject({
      message: "Network Error",
      status: 0,
      code: "REQUEST_FAILED",
      details: {},
      payload: {
        message: "Network Error",
        status: 0,
        code: "REQUEST_FAILED",
      },
    });
  });

  it("converte erros nativos preservando a mensagem", () => {
    const source = new Error("Timeout");

    expect(toApiError(source)).toMatchObject({
      message: "Timeout",
      status: 0,
      code: "REQUEST_FAILED",
      payload: source,
    });
  });

  it("usa a mensagem padrão para valores desconhecidos", () => {
    expect(toApiError("oops")).toMatchObject({
      message: "Nao foi possivel concluir a requisicao.",
      status: 0,
      code: "REQUEST_FAILED",
      payload: "oops",
    });
  });
});
