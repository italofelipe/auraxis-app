/**
 * Cores fixas para conteúdo sobre superfícies escuras — o hero teal e as faces
 * dos cartões de crédito, que são SEMPRE escuras (gradiente de marca) em ambos
 * os temas (claro/escuro). Como o texto branco e os overlays translúcidos não
 * dependem do tema do app, vivem aqui (em `shared/theme/**`, fora do tema
 * resolvido) e são consumidos via prop `color`/`backgroundColor` string — o
 * mesmo padrão dos charts, que leem `theme.<token>.val`.
 *
 * Mantém os componentes `.tsx` de feature 100% livres de hex hardcoded.
 */
export const onDarkSurfaceColors = {
  /** Texto primário sobre o hero / face do cartão (branco puro). */
  text: "#FFFFFF",
  /** Texto secundário/legenda sobre superfície escura (branco a ~72%). */
  textMuted: "rgba(255,255,255,0.72)",
  /** Texto terciário/overline sobre superfície escura (branco a ~58%). */
  textSubtle: "rgba(255,255,255,0.58)",
  /** Fundo dos botões redondos do hero (branco translúcido). */
  controlBackground: "rgba(255,255,255,0.14)",
  /** Fundo pressionado dos botões redondos do hero. */
  controlBackgroundPressed: "rgba(255,255,255,0.24)",
  /** Trilho da mini-barra de uso na face do cartão. */
  track: "rgba(255,255,255,0.22)",
  /** Borda sutil de realce do cartão selecionado. */
  selectedBorder: "rgba(255,255,255,0.9)",
  /** Brilho/gloss diagonal sobre a face do cartão. */
  gloss: "rgba(255,255,255,0.12)",
  /** Glifo do chip dourado da face do cartão. */
  chip: "#E9C877",
  /** Verde de receita/positivo legível sobre o hero teal escuro. */
  positive: "#7FE3B8",
  /** Vermelho de despesa/negativo legível sobre o hero teal escuro. */
  negative: "#FF9EA1",
} as const;

export type OnDarkSurfaceColorKey = keyof typeof onDarkSurfaceColors;
