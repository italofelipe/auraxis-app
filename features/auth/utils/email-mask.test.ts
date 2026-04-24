import { maskEmail } from "@/features/auth/utils/email-mask";

describe("maskEmail", () => {
  it("retorna string vazia quando entrada e nula", () => {
    expect(maskEmail(null)).toBe("");
    expect(maskEmail(undefined)).toBe("");
    expect(maskEmail("")).toBe("");
  });

  it("retorna string vazia quando entrada nao e email valido", () => {
    expect(maskEmail("invalido")).toBe("");
    expect(maskEmail("@auraxis.com")).toBe("");
    expect(maskEmail("user@")).toBe("");
  });

  it("mascara local part preservando dois caracteres iniciais e dominio", () => {
    expect(maskEmail("italo@auraxis.com")).toBe("it***@auraxis.com");
  });

  it("preserva apenas um caractere quando local part tem dois caracteres", () => {
    expect(maskEmail("ab@x.io")).toBe("a*@x.io");
  });

  it("preserva uma estrela mesmo para local part de um caractere", () => {
    expect(maskEmail("a@x.io")).toBe("a*@x.io");
  });

  it("trima espacos antes de mascarar", () => {
    expect(maskEmail("  italo@auraxis.com  ")).toBe("it***@auraxis.com");
  });
});
