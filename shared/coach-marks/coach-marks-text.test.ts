import { parseBoldSegments } from "@/shared/coach-marks/coach-marks-text";

describe("parseBoldSegments", () => {
  it("devolve lista vazia para string vazia", () => {
    expect(parseBoldSegments("")).toEqual([]);
  });

  it("trata texto sem marcadores como um único segmento normal", () => {
    expect(parseBoldSegments("texto simples")).toEqual([
      { text: "texto simples", bold: false },
    ]);
  });

  it("marca um trecho em negrito no meio da frase", () => {
    expect(parseBoldSegments("O cartão **Todos os cartões** soma tudo")).toEqual(
      [
        { text: "O cartão ", bold: false },
        { text: "Todos os cartões", bold: true },
        { text: " soma tudo", bold: false },
      ],
    );
  });

  it("suporta múltiplos trechos em negrito", () => {
    expect(parseBoldSegments("**Faturas** e **Analítico**")).toEqual([
      { text: "Faturas", bold: true },
      { text: " e ", bold: false },
      { text: "Analítico", bold: true },
    ]);
  });

  it("preserva a copy quando há marcador solto (sem fechamento)", () => {
    const input = "preço ** sem par";
    expect(parseBoldSegments(input)).toEqual([{ text: input, bold: false }]);
  });

  it("descarta segmentos vazios entre marcadores adjacentes", () => {
    expect(parseBoldSegments("****texto")).toEqual([
      { text: "texto", bold: false },
    ]);
  });
});
