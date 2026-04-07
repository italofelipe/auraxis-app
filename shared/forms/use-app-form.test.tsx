import { renderHook } from "@testing-library/react-native";

import {
  loginSchema,
  type LoginFormValues,
} from "@/features/auth/validators";
import { useAppForm } from "@/shared/forms/use-app-form";

describe("useAppForm", () => {
  it("aplica os valores default do formulario", () => {
    const { result } = renderHook(() => {
      return useAppForm<LoginFormValues>(loginSchema, {
        defaultValues: {
          email: "user@auraxis.com",
          password: "",
        },
      });
    });

    expect(result.current.getValues()).toEqual({
      email: "user@auraxis.com",
      password: "",
    });
  });
});
