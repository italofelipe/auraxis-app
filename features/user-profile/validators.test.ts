import { updateUserProfileSchema } from "@/features/user-profile/validators";

describe("updateUserProfileSchema", () => {
  it("aceita patch parcial valido", () => {
    expect(() =>
      updateUserProfileSchema.parse({ occupation: "Engenheira" }),
    ).not.toThrow();
  });

  it("rejeita patch vazio", () => {
    expect(() => updateUserProfileSchema.parse({})).toThrow();
  });

  it("rejeita stateUf invalido", () => {
    expect(() => updateUserProfileSchema.parse({ stateUf: "SAO" })).toThrow();
  });

  it("rejeita monthlyIncome negativo", () => {
    expect(() => updateUserProfileSchema.parse({ monthlyIncome: -10 })).toThrow();
  });

  it("aceita investorProfile do enum", () => {
    expect(() =>
      updateUserProfileSchema.parse({ investorProfile: "conservador" }),
    ).not.toThrow();
  });

  it("rejeita investorProfile fora do enum", () => {
    expect(() =>
      updateUserProfileSchema.parse({ investorProfile: "outro" }),
    ).toThrow();
  });
});
