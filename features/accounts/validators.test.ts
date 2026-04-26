import { createAccountSchema } from "@/features/accounts/validators";

describe("createAccountSchema", () => {
  const baseValid = {
    name: "Conta principal",
    accountType: "checking" as const,
  };

  it("aceita payload minimo valido", () => {
    expect(() => createAccountSchema.parse(baseValid)).not.toThrow();
  });

  it("rejeita nome vazio", () => {
    expect(() =>
      createAccountSchema.parse({ ...baseValid, name: "" }),
    ).toThrow();
  });

  it("rejeita accountType invalido", () => {
    expect(() =>
      createAccountSchema.parse({ ...baseValid, accountType: "crypto" }),
    ).toThrow();
  });

  it("aceita initialBalance opcional", () => {
    expect(() =>
      createAccountSchema.parse({ ...baseValid, initialBalance: 1000 }),
    ).not.toThrow();
  });

  it("aceita institution opcional", () => {
    expect(() =>
      createAccountSchema.parse({ ...baseValid, institution: "Nubank" }),
    ).not.toThrow();
  });
});
