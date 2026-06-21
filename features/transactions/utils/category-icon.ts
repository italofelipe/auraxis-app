/**
 * Resolve o glifo de ícone (`MaterialCommunityIcons`) de uma categoria a partir
 * do nome de ícone cru da Tag (API) e/ou do nome da categoria. O backend pode
 * mandar nomes de bibliotecas diferentes (ou nenhum), então mapeamos apelidos
 * conhecidos e, em último caso, inferimos pelo nome da categoria — sempre com
 * um fallback estável. Função pura (sem React), unit-testável.
 */

/** Glifo padrão para categorias sem ícone reconhecível. */
export const DEFAULT_CATEGORY_ICON = "tag-outline";

/**
 * Apelidos de ícone (em minúsculas) → glifo `MaterialCommunityIcons`. Cobre os
 * nomes mais comuns que a API/seed pode enviar (lucide/feather/MCI), além das
 * categorias do handoff de design (Impostos, Salário, Eletrônicos, etc.).
 */
const ICON_ALIASES: Readonly<Record<string, string>> = {
  // Genéricos / dinheiro
  cash: "cash",
  money: "cash",
  wallet: "wallet-outline",
  bank: "bank-outline",
  salary: "briefcase-outline",
  briefcase: "briefcase-outline",
  income: "cash-plus",
  receipt: "receipt-text-outline",
  tax: "file-document-outline",
  taxes: "file-document-outline",
  // Casa / contas
  home: "home-outline",
  house: "home-outline",
  rent: "home-city-outline",
  bolt: "lightning-bolt-outline",
  zap: "lightning-bolt-outline",
  energy: "lightning-bolt-outline",
  water: "water-outline",
  wifi: "wifi",
  internet: "wifi",
  phone: "cellphone",
  // Compras / lazer
  cart: "cart-outline",
  "shopping-cart": "cart-outline",
  shopping: "shopping-outline",
  bag: "shopping-outline",
  gift: "gift-outline",
  electronics: "monitor",
  monitor: "monitor",
  laptop: "laptop",
  gamepad: "gamepad-variant-outline",
  game: "gamepad-variant-outline",
  leisure: "party-popper",
  movie: "movie-outline",
  music: "music",
  // Transporte
  car: "car-outline",
  bus: "bus",
  fuel: "gas-station-outline",
  plane: "airplane",
  travel: "airplane",
  // Comida / saúde
  food: "silverware-fork-knife",
  restaurant: "silverware-fork-knife",
  coffee: "coffee-outline",
  health: "heart-pulse",
  medical: "medical-bag",
  pet: "paw-outline",
  // Serviços / assinaturas / cartão
  service: "wrench-outline",
  services: "wrench-outline",
  subscription: "autorenew",
  repeat: "autorenew",
  card: "credit-card-outline",
  "credit-card": "credit-card-outline",
  financing: "chart-line",
  education: "school-outline",
};

/**
 * Palavras-chave do NOME da categoria (em minúsculas, sem acento) → glifo, para
 * inferir o ícone quando a Tag não traz um nome de ícone reconhecível.
 */
const NAME_KEYWORDS: readonly (readonly [string, string])[] = [
  ["imposto", "file-document-outline"],
  ["salario", "briefcase-outline"],
  ["eletronic", "monitor"],
  ["servico", "wrench-outline"],
  ["cartao", "credit-card-outline"],
  ["financ", "chart-line"],
  ["lazer", "party-popper"],
  ["moradia", "home-outline"],
  ["aluguel", "home-city-outline"],
  ["internet", "wifi"],
  ["pet", "paw-outline"],
  ["mercado", "cart-outline"],
  ["compra", "shopping-outline"],
  ["transporte", "car-outline"],
  ["viagem", "airplane"],
  ["saude", "heart-pulse"],
  ["aliment", "silverware-fork-knife"],
  ["educa", "school-outline"],
  ["assinatura", "autorenew"],
];

/** Normaliza para minúsculas sem acentos (para casar palavras-chave do nome). */
const normalize = (value: string): string =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

/**
 * Resolve o glifo `MaterialCommunityIcons` de uma categoria: tenta o apelido do
 * ícone cru, depois infere por palavra-chave do nome e, por fim, usa o fallback.
 *
 * @param icon Nome de ícone cru da Tag (ou null).
 * @param name Nome da categoria (usado para inferência).
 * @returns Nome do glifo MCI a renderizar.
 */
export const resolveCategoryIcon = (
  icon: string | null,
  name: string,
): string => {
  if (icon) {
    const alias = ICON_ALIASES[icon.trim().toLowerCase()];
    if (alias) {
      return alias;
    }
  }
  const normalizedName = normalize(name);
  for (const [keyword, glyph] of NAME_KEYWORDS) {
    if (normalizedName.includes(keyword)) {
      return glyph;
    }
  }
  return DEFAULT_CATEGORY_ICON;
};
