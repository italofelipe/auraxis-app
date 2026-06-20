/**
 * Parser PURO de "markdown-ish bold" para o corpo dos tooltips do tour.
 *
 * O corpo de cada passo usa `**negrito**` (mesma convenção do handoff). Este
 * helper quebra a string em segmentos `{ text, bold }` para o tooltip renderizar
 * cada trecho com o peso de fonte correto — sem `dangerouslySetInnerHTML` (que
 * não existe em React Native) e sem regex no JSX.
 */

/** Segmento de texto com indicação de negrito. */
export interface TextSegment {
  /** Conteúdo textual do segmento. */
  readonly text: string;
  /** `true` quando o trecho deve ser renderizado em negrito. */
  readonly bold: boolean;
}

const BOLD_DELIMITER = "**";

/**
 * Quebra uma string com marcadores `**negrito**` em segmentos ordenados.
 *
 * Regras:
 * - Pares de `**` alternam negrito/normal; trechos vazios são descartados.
 * - Um `**` solto (sem par de fechamento) é tratado como texto literal, então
 *   nenhuma copy "some" por erro de marcação.
 *
 * @param input Texto com marcadores de negrito.
 * @returns Lista de segmentos na ordem original.
 */
export const parseBoldSegments = (input: string): readonly TextSegment[] => {
  if (input.length === 0) {
    return [];
  }

  const rawParts = input.split(BOLD_DELIMITER);

  // Número par de partes ⇒ há um `**` sem fechamento ⇒ trata tudo como normal.
  const hasUnbalancedMarkers = rawParts.length % 2 === 0;
  if (hasUnbalancedMarkers) {
    return [{ text: input, bold: false }];
  }

  const segments: TextSegment[] = [];
  rawParts.forEach((part, index) => {
    if (part.length === 0) {
      return;
    }
    segments.push({ text: part, bold: index % 2 === 1 });
  });

  return segments;
};
