import * as SecureStore from "expo-secure-store";

/**
 * Flag de "tour de Cartões já visto", persistida no secure-store (espelha
 * `weekly-snapshot-seen-storage`). Quando ausente, o tour abre automaticamente
 * na primeira visita à HOME de Cartões; depois de concluído/pulado, fica marcado.
 */

/** Chave do secure-store que marca o tour de Cartões como já visto. */
export const CARDS_TOUR_SEEN_STORAGE_KEY = "auraxis.cards-tour.seen.v1";

/** Valor persistido quando o tour é concluído/pulado. */
const SEEN_VALUE = "1";

/**
 * Indica se o tour de Cartões já foi visto. Retorna `false` quando nada foi
 * persistido ainda ou em qualquer erro de leitura (o tour reabre — comportamento
 * seguro: melhor reapresentar do que esconder por engano).
 *
 * @returns `true` quando o tour já foi marcado como visto.
 */
export const loadCardsTourSeen = async (): Promise<boolean> => {
  try {
    const value = await SecureStore.getItemAsync(CARDS_TOUR_SEEN_STORAGE_KEY);
    return value === SEEN_VALUE;
  } catch {
    return false;
  }
};

/**
 * Marca o tour de Cartões como visto. Engole erros de escrita — falhar ao
 * persistir apenas reabre o tour na próxima visita.
 */
export const persistCardsTourSeen = async (): Promise<void> => {
  try {
    await SecureStore.setItemAsync(CARDS_TOUR_SEEN_STORAGE_KEY, SEEN_VALUE);
  } catch {
    // Não-fatal: o tour reaparece até a próxima escrita bem-sucedida.
  }
};
