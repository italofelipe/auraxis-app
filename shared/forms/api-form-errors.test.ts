import { ApiError } from "@/core/http/api-error";
import { extractFormFieldErrors } from "@/shared/forms/api-form-errors";

const createApiError = (details: Record<string, unknown>): ApiError => {
  return new ApiError({
    message: "validation error",
    code: "VALIDATION_ERROR",
    status: 400,
    details,
  });
};

describe("extractFormFieldErrors", () => {
  it("normaliza detalhes de erro em mensagens por campo", () => {
    expect(
      extractFormFieldErrors<"email" | "password">(
        createApiError({
          email: "Informe um e-mail valido.",
          password: "Senha obrigatoria.",
        }),
      ),
    ).toEqual({
      email: "Informe um e-mail valido.",
      password: "Senha obrigatoria.",
    });
  });

  it("ignora payloads sem details estruturado", () => {
    expect(extractFormFieldErrors<"email">(null)).toEqual({});
  });
});
