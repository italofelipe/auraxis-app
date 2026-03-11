import { PRIVACY_URL, TERMS_URL } from "./web-urls";

describe("web-urls", () => {
  it("TERMS_URL aponta para /termos na URL base", () => {
    expect(TERMS_URL).toMatch(/\/termos$/u);
  });

  it("PRIVACY_URL aponta para /privacidade na URL base", () => {
    expect(PRIVACY_URL).toMatch(/\/privacidade$/u);
  });

  it("TERMS_URL é uma string HTTPS válida", () => {
    expect(TERMS_URL).toMatch(/^https?:\/\//u);
  });

  it("PRIVACY_URL é uma string HTTPS válida", () => {
    expect(PRIVACY_URL).toMatch(/^https?:\/\//u);
  });

  it("TERMS_URL e PRIVACY_URL têm a mesma base de domínio", () => {
    const termsBase = TERMS_URL.replace(/\/termos$/u, "");
    const privacyBase = PRIVACY_URL.replace(/\/privacidade$/u, "");
    expect(termsBase).toBe(privacyBase);
  });

  it("URLs não têm barra no final antes do path", () => {
    expect(TERMS_URL).not.toMatch(/\/\/termos/u);
    expect(PRIVACY_URL).not.toMatch(/\/\/privacidade/u);
  });
});
