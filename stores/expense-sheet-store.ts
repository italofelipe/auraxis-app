import { create } from "zustand";

import type { TransactionRecord } from "@/features/transactions/contracts";

export interface ExpenseSheetCreateOptions {
  readonly presetCreditCardId?: string | null;
  readonly presetMonth?: string | null;
}

export type ExpenseSheetRequest =
  | ({
      readonly mode: "create";
    } & ExpenseSheetCreateOptions)
  | {
      readonly mode: "edit";
      readonly transaction: TransactionRecord;
    };

const defaultRequest: ExpenseSheetRequest = { mode: "create" };

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
  /** Contexto atual do sheet: criação simples, criação predefinida ou edição. */
  readonly request: ExpenseSheetRequest;
  /** Abre o sheet de lançar despesa. */
  readonly open: () => void;
  /** Abre o sheet em modo criação com contexto opcional. */
  readonly openCreate: (options?: ExpenseSheetCreateOptions) => void;
  /** Abre o sheet em modo edição para a transação informada. */
  readonly openEdit: (transaction: TransactionRecord) => void;
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
  request: defaultRequest,
  open: (): void => set({ isOpen: true, request: defaultRequest }),
  openCreate: (options = {}): void =>
    set({
      isOpen: true,
      request: {
        mode: "create",
        presetCreditCardId: options.presetCreditCardId ?? undefined,
        presetMonth: options.presetMonth ?? undefined,
      },
    }),
  openEdit: (transaction): void =>
    set({ isOpen: true, request: { mode: "edit", transaction } }),
  close: (): void => set({ isOpen: false, request: defaultRequest }),
}));

/**
 * Reseta o store do sheet de despesa para o estado fechado (utilitário de teste).
 */
export const resetExpenseSheetStore = (): void => {
  useExpenseSheetStore.setState({ isOpen: false, request: defaultRequest });
};
