import { hashStringToIndex } from "@/shared/utils/hash";

/**
 * Paleta de fallback para categorias (Tags) sem cor própria. Cores do handoff
 * (Alimentação, Transporte, Compras, Lazer, Assinaturas, Saúde, Viagem) + extras
 * para cobrir mais de 7 categorias. A cor real da Tag (API) tem prioridade.
 */
export const categoryPalette: readonly string[] = [
  "#11A36B",
  "#2E7CF6",
  "#9B5DE5",
  "#F15BB5",
  "#FF8A3D",
  "#E5484D",
  "#00BBD6",
  "#7C8DB5",
  "#E0A458",
  "#3FB6A8",
];

/** Cor neutra para lançamentos/grupos sem categoria definida. */
export const NO_CATEGORY_COLOR = "#7C8B99";

const HEX_PATTERN = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

/** Entrada mínima para resolver a cor de uma categoria. */
export interface CategoryColorInput {
  readonly id: string;
  readonly color?: string | null;
}

/**
 * Resolve a cor de uma categoria: usa a cor da Tag quando é um hex válido,
 * senão escolhe uma cor estável da paleta a partir do id.
 *
 * @param category Categoria (id obrigatório; color é a cor da Tag, se houver).
 * @returns Cor hexadecimal.
 */
export const resolveCategoryColor = (category: CategoryColorInput): string => {
  const color = category.color?.trim();
  if (color && HEX_PATTERN.test(color)) {
    return color;
  }
  return (
    categoryPalette[hashStringToIndex(category.id, categoryPalette.length)] ??
    categoryPalette[0]
  );
};
