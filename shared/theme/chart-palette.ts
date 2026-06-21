/**
 * Paleta ordenada de cores para séries de gráfico (barras empilhadas por cartão,
 * legendas de donut, etc.). Distinta da paleta de categorias para evitar colisão
 * visual quando ambos aparecem juntos.
 */
export const chartSeriesPalette: readonly string[] = [
  "#0E6376",
  "#2E7CF6",
  "#9B5DE5",
  "#FF8A3D",
  "#11A36B",
  "#E5484D",
  "#00BBD6",
  "#F15BB5",
];

/**
 * Resolve a cor de uma série pelo índice, dando a volta na paleta (com suporte a
 * índices negativos).
 *
 * @param index Índice da série (0-based).
 * @returns Cor hexadecimal da paleta.
 */
export const resolveSeriesColor = (index: number): string => {
  const length = chartSeriesPalette.length;
  const safeIndex = ((Math.trunc(index) % length) + length) % length;
  return chartSeriesPalette[safeIndex] ?? chartSeriesPalette[0];
};
