/**
 * Configuração dos 8 passos do tour guiado da HOME de Cartões.
 *
 * Cada passo carrega a copy FINAL em pt-BR (com marcadores `**negrito**`
 * preservados — paridade exata com o handoff), a chave da âncora a destacar, a
 * flag `center` (passos 1 e 8), o raio do recorte e um DESCRITOR de `before`
 * (qual ação do controller rodar + se deve rolar até um alvo). O hook
 * (`use-cards-tour`) traduz o descritor em ações concretas antes de medir.
 *
 * Esta constante estruturada é a única fonte da copy literal — padrão aceito no
 * codebase (sem i18n para o tour), conforme governança da task.
 */
import { coachMarks } from "@/shared/theme/coach-marks-tokens";

/** Chaves das âncoras registradas na tela/tab bar. */
export type CardsTourAnchorKey =
  | "cards"
  | "views"
  | "months"
  | "fatura"
  | "fab"
  | "theme";

/** Alvos de rolagem que o `before()` pode acionar antes de medir. */
export type CardsTourScrollTarget = "top" | "fatura";

/**
 * Descritor declarativo do setup de um passo. O hook executa, na ordem:
 * `selectCard` → `setView` → `scroll`. Campos ausentes = sem ação.
 */
export interface CardsTourBeforeDescriptor {
  /** Define a view antes de medir (sempre "faturas" quando presente). */
  readonly setView?: "faturas";
  /** Reseta a seleção de cartão ("Todos os cartões") quando `true`. */
  readonly selectAllCards?: boolean;
  /** Rola o conteúdo até o topo ou até o card de fatura. */
  readonly scroll?: CardsTourScrollTarget;
}

/** Um passo completo do tour de Cartões. */
export interface CardsTourStepConfig {
  /** Identificador estável do passo. */
  readonly id: string;
  /** Eyebrow exibido no tooltip. */
  readonly eyebrow: string;
  /** Título do passo. */
  readonly title: string;
  /** Corpo do passo (com marcadores `**negrito**`). */
  readonly body: string;
  /** Âncora a destacar (`null` em passos centralizados). */
  readonly anchorKey: CardsTourAnchorKey | null;
  /** Passo centralizado (sem spotlight). */
  readonly center: boolean;
  /** Padding extra (px) somado ao bounding box do alvo. */
  readonly padding: number;
  /** Raio dos cantos do recorte (px). */
  readonly radius: number;
  /** Setup declarativo a aplicar antes de medir. */
  readonly before: CardsTourBeforeDescriptor;
}

/** Padding do recorte para alvos retangulares (px). */
const RECT_PADDING = 8;

/** Padding do recorte para alvos redondos (px), conforme handoff. */
const ROUND_PADDING = 6;

/** Total de passos do tour. */
export const CARDS_TOUR_TOTAL_STEPS = 8;

/**
 * Os 8 passos do tour, em ordem. A copy é final — não alterar sem revisão de
 * UX writing.
 */
export const cardsTourSteps: readonly CardsTourStepConfig[] = [
  {
    id: "welcome",
    eyebrow: "BEM-VINDO AO AURAXIS",
    title: "Seus cartões em um só lugar",
    body: "Em poucos toques você entende para onde vai o seu dinheiro no crédito. Vamos te mostrar onde fica cada coisa — leva 30 segundos.",
    anchorKey: null,
    center: true,
    padding: 0,
    radius: coachMarks.radiusGeneral,
    before: { setView: "faturas", selectAllCards: true, scroll: "top" },
  },
  {
    id: "cards",
    eyebrow: "PASSO 2 DE 8",
    title: "Reunimos todos os seus cartões",
    body: "Deslize para navegar. O cartão escuro **Todos os cartões** soma as faturas de todos; toque em um cartão para focar só nele — e tudo abaixo se ajusta à sua escolha.",
    anchorKey: "cards",
    center: false,
    padding: RECT_PADDING,
    radius: coachMarks.radiusGeneral,
    before: { scroll: "top" },
  },
  {
    id: "views",
    eyebrow: "PASSO 3 DE 8",
    title: "Dois níveis de detalhe",
    body: "**Faturas** traz o resumo do mês, direto ao ponto. **Analítico** abre os números — evolução, categorias e comparação entre cartões. Alterne quando precisar.",
    anchorKey: "views",
    center: false,
    padding: RECT_PADDING,
    radius: coachMarks.radiusGeneral,
    before: { setView: "faturas", scroll: "top" },
  },
  {
    id: "months",
    eyebrow: "PASSO 4 DE 8",
    title: "Navegue no tempo",
    body: "Começamos no mês atual. Uma fatura **aberta** ainda recebe lançamentos; uma **fechada** já foi consolidada. Volte meses para revisar ou avance para planejar.",
    anchorKey: "months",
    center: false,
    padding: RECT_PADDING,
    radius: coachMarks.radiusGeneral,
    before: { setView: "faturas", scroll: "top" },
  },
  {
    id: "fatura",
    eyebrow: "PASSO 5 DE 8",
    title: "Do resumo ao extrato",
    body: "Aqui está o total do mês, com vencimento e número de lançamentos. Toque para abrir o **extrato completo**, com os gastos agrupados por categoria.",
    anchorKey: "fatura",
    center: false,
    padding: RECT_PADDING,
    radius: coachMarks.radiusGeneral,
    before: { setView: "faturas", scroll: "fatura" },
  },
  {
    id: "fab",
    eyebrow: "PASSO 6 DE 8",
    title: "Lançar despesa leva segundos",
    body: "Toque no **+** a qualquer momento. O cartão é **opcional**: registre agora e defina depois. Comprou parcelado? Informe as parcelas — e, se houver **entrada**, o Auraxis distribui o restante nas próximas faturas, automaticamente.",
    anchorKey: "fab",
    center: false,
    padding: ROUND_PADDING,
    radius: coachMarks.radiusPill,
    before: {},
  },
  {
    id: "theme",
    eyebrow: "PASSO 7 DE 8",
    title: "Claro ou escuro, você decide",
    body: "Toque para alternar o tema. Os valores continuam nítidos e com bom contraste em qualquer ambiente — de dia ou de madrugada.",
    anchorKey: "theme",
    center: false,
    padding: ROUND_PADDING,
    radius: coachMarks.radiusPill,
    before: { scroll: "top" },
  },
  {
    id: "done",
    eyebrow: "TUDO PRONTO",
    title: "Você já sabe o essencial",
    body: "Explore à vontade. Para rever este guia, é só tocar no **?** no topo da tela de Cartões.",
    anchorKey: null,
    center: true,
    padding: 0,
    radius: coachMarks.radiusGeneral,
    before: { scroll: "top" },
  },
];
