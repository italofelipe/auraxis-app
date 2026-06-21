import { create } from "zustand";

/**
 * Estado global do bottom sheet "Lançar despesa".
 *
 * Espelha o padrão minimalista do {@link useSessionStore} (zustand puro, sem
 * middleware). Apenas guarda se o sheet está aberto e expõe `open`/`close` para
 * qualquer parte do app (FAB da tab bar, telas de cartão) disparar a abertura
 * sem prop drilling. A montagem do sheet em si vive no `<ExpenseSheetHost />`,
 * que reage a `isOpen`.
 */
export interface ExpenseSheetState {
  /** `true` quando o sheet de lançar despesa deve estar visível. */
  readonly isOpen: boolean;
  /** Abre o sheet de lançar despesa. */
  readonly open: () => void;
  /** Fecha o sheet de lançar despesa. */
  readonly close: () => void;
}

/**
 * Store global que controla a visibilidade do sheet "Lançar despesa".
 *
 * @returns Seletor zustand com `isOpen` e os comandos `open`/`close`.
 */
export const useExpenseSheetStore = create<ExpenseSheetState>((set) => ({
  isOpen: false,
  open: (): void => set({ isOpen: true }),
  close: (): void => set({ isOpen: false }),
}));

/**
 * Reseta o store do sheet de despesa para o estado fechado (utilitário de teste).
 */
export const resetExpenseSheetStore = (): void => {
  useExpenseSheetStore.setState({ isOpen: false });
};
