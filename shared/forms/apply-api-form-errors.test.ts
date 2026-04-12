import type { UseFormSetError } from "react-hook-form";

import { ApiError } from "@/core/http/api-error";
import { applyApiFormErrors } from "@/shared/forms/apply-api-form-errors";

interface SampleFormValues {
  readonly email: string;
  readonly password: string;
}

describe("applyApiFormErrors", () => {
  it("aplica erros de campo ao form", () => {
    const setError = jest.fn() as unknown as UseFormSetError<SampleFormValues>;
    const error = new ApiError({
      message: "Erro de validacao",
      status: 422,
      details: {
        email: "Email invalido",
        password: "Senha curta",
      },
    });

    const result = applyApiFormErrors(error, setError);

    expect(result).toEqual({
      email: "Email invalido",
      password: "Senha curta",
    });
    expect(setError).toHaveBeenCalledWith("email", {
      type: "server",
      message: "Email invalido",
    });
    expect(setError).toHaveBeenCalledWith("password", {
      type: "server",
      message: "Senha curta",
    });
  });
});
