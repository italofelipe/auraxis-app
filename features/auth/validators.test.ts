import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from "@/features/auth/validators";

describe("auth validators", () => {
  it("aceita credenciais validas no login", () => {
    expect(() => {
      loginSchema.parse({
        email: "user@auraxis.com",
        password: "12345678",
      });
    }).not.toThrow();
  });

  it("rejeita nome curto no cadastro", () => {
    expect(() => {
      registerSchema.parse({
        name: "A",
        email: "user@auraxis.com",
        password: "12345678",
      });
    }).toThrow();
  });

  it("rejeita email invalido no forgot password", () => {
    expect(() => {
      forgotPasswordSchema.parse({
        email: "invalido",
      });
    }).toThrow();
  });

  it("rejeita token vazio no reset", () => {
    expect(() => {
      resetPasswordSchema.parse({
        token: "",
        password: "12345678",
      });
    }).toThrow();
  });
});
