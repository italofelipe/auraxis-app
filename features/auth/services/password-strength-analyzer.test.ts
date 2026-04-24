import {
  PasswordStrengthAnalyzer,
  passwordStrengthAnalyzer,
} from "@/features/auth/services/password-strength-analyzer";

describe("PasswordStrengthAnalyzer", () => {
  it("retorna nivel empty para senha vazia", () => {
    const analysis = passwordStrengthAnalyzer.analyze("");
    expect(analysis.level).toBe("empty");
    expect(analysis.score).toBe(0);
    expect(analysis.missingLabels.length).toBeGreaterThan(0);
    expect(analysis.summary).toContain("Defina");
  });

  it("classifica senha curta sem variacao como fraca", () => {
    const analysis = passwordStrengthAnalyzer.analyze("abc");
    expect(analysis.level).toBe("weak");
    expect(analysis.score).toBeLessThanOrEqual(1);
  });

  it("classifica senha com 2 criterios como fair", () => {
    const analysis = passwordStrengthAnalyzer.analyze("AbcdefghIJ");
    expect(analysis.score).toBe(2);
    expect(analysis.level).toBe("fair");
  });

  it("classifica senha com 3 criterios como good", () => {
    const analysis = passwordStrengthAnalyzer.analyze("Abcdefgh12");
    expect(analysis.score).toBe(3);
    expect(analysis.level).toBe("good");
  });

  it("classifica senha com 4 criterios como strong", () => {
    const analysis = passwordStrengthAnalyzer.analyze("Senha!Forte01");
    expect(analysis.level).toBe("strong");
    expect(analysis.score).toBe(4);
    expect(analysis.missingLabels).toEqual([]);
  });

  it("lista criterios faltantes para feedback ao usuario", () => {
    const analysis = passwordStrengthAnalyzer.analyze("abcdefghij");
    const missingIds = analysis.criteria
      .filter((item) => !item.satisfied)
      .map((item) => item.id);
    expect(missingIds).toEqual(expect.arrayContaining(["uppercase", "digit", "symbol"]));
  });

  it("respeita politica injetada (DIP) com minLength customizado", () => {
    const analyzer = new PasswordStrengthAnalyzer({
      minLength: 4,
      patterns: {
        uppercase: /[A-Z]/,
        lowercase: /[a-z]/,
        digit: /\d/,
        symbol: /[^A-Za-z0-9]/,
      },
    });

    const analysis = analyzer.analyze("Ab1!");
    expect(analysis.level).toBe("strong");
  });
});
