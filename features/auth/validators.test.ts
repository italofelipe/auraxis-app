import {
  forgotPasswordSchema,
  loginSchema,
  passwordPolicy,
  registerSchema,
  resetPasswordSchema,
} from "@/features/auth/validators";

const validRegisterPayload = {
  name: "Italo Chagas",
  email: "user@auraxis.com",
  password: "Senha!Forte01",
  confirmPassword: "Senha!Forte01",
};

describe("auth validators", () => {
  it("aceita credenciais validas no login", () => {
    expect(() => {
      loginSchema.parse({
        email: "user@auraxis.com",
        password: "12345678",
      });
    }).not.toThrow();
  });

  it("rejeita login sem senha", () => {
    expect(() => {
      loginSchema.parse({ email: "user@auraxis.com", password: "" });
    }).toThrow();
  });

  it("aceita cadastro com senha forte e confirmacao igual", () => {
    expect(() => registerSchema.parse(validRegisterPayload)).not.toThrow();
  });

  it("rejeita nome curto no cadastro", () => {
    expect(() => {
      registerSchema.parse({ ...validRegisterPayload, name: "A" });
    }).toThrow();
  });

  it("rejeita senha sem letra maiuscula", () => {
    expect(() => {
      registerSchema.parse({
        ...validRegisterPayload,
        password: "senha!forte01",
        confirmPassword: "senha!forte01",
      });
    }).toThrow();
  });

  it("rejeita senha sem numero", () => {
    expect(() => {
      registerSchema.parse({
        ...validRegisterPayload,
        password: "Senha!Forte!",
        confirmPassword: "Senha!Forte!",
      });
    }).toThrow();
  });

  it("rejeita senha sem simbolo", () => {
    expect(() => {
      registerSchema.parse({
        ...validRegisterPayload,
        password: "Senha1Forte01",
        confirmPassword: "Senha1Forte01",
      });
    }).toThrow();
  });

  it("rejeita senha curta", () => {
    expect(() => {
      registerSchema.parse({
        ...validRegisterPayload,
        password: "Senha!1",
        confirmPassword: "Senha!1",
      });
    }).toThrow();
  });

  it("rejeita confirmacao diferente da senha", () => {
    expect(() => {
      registerSchema.parse({
        ...validRegisterPayload,
        confirmPassword: "Outra!Senha02",
      });
    }).toThrow();
  });

  it("rejeita email invalido no forgot password", () => {
    expect(() => {
      forgotPasswordSchema.parse({ email: "invalido" });
    }).toThrow();
  });

  it("rejeita token vazio no reset", () => {
    expect(() => {
      resetPasswordSchema.parse({
        token: "",
        password: "Senha!Forte01",
        confirmPassword: "Senha!Forte01",
      });
    }).toThrow();
  });

  it("aceita reset valido", () => {
    expect(() =>
      resetPasswordSchema.parse({
        token: "tok123",
        password: "Senha!Forte01",
        confirmPassword: "Senha!Forte01",
      }),
    ).not.toThrow();
  });

  it("expoe a politica de senha consumivel pelo analyzer", () => {
    expect(passwordPolicy.minLength).toBe(10);
    expect(passwordPolicy.patterns.uppercase.test("A")).toBe(true);
    expect(passwordPolicy.patterns.symbol.test("!")).toBe(true);
  });
});
