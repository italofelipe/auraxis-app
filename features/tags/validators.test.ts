import { createTagSchema } from "@/features/tags/validators";

describe("createTagSchema", () => {
  it("aceita payload minimo valido", () => {
    expect(() =>
      createTagSchema.parse({ name: "Alimentacao" }),
    ).not.toThrow();
  });

  it("rejeita nome vazio", () => {
    expect(() => createTagSchema.parse({ name: "" })).toThrow();
  });

  it("aceita color em #RRGGBB", () => {
    expect(() =>
      createTagSchema.parse({ name: "X", color: "#FF8800" }),
    ).not.toThrow();
  });

  it("rejeita color em formato invalido", () => {
    expect(() =>
      createTagSchema.parse({ name: "X", color: "vermelho" }),
    ).toThrow();
  });

  it("aceita icon opcional como string", () => {
    expect(() =>
      createTagSchema.parse({ name: "X", icon: "utensils" }),
    ).not.toThrow();
  });
});
