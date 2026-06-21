import { useCallback, useEffect, useRef, type ReactElement } from "react";

import type { BottomSheetModal } from "@gorhom/bottom-sheet";

import { ExpenseSheet } from "@/features/credit-cards/components/expense-sheet/expense-sheet";
import { useExpenseForm } from "@/features/credit-cards/hooks/use-expense-form";
import { triggerHapticNotification } from "@/shared/feedback/haptics";
import { useExpenseSheetStore } from "@/stores/expense-sheet-store";

/**
 * Host único do sheet "Lançar despesa". Montado uma vez perto da raiz das tabs
 * privadas, reage ao `useExpenseSheetStore` (global) para apresentar/dispensar
 * o `BottomSheetModal` e instancia o `useExpenseForm` (estado/handlers). No
 * submit com sucesso: dispara haptic, fecha o sheet e reseta o formulário.
 *
 * Permite abrir o sheet de qualquer lugar (FAB da tab bar, telas de cartão) via
 * `useExpenseSheetStore().open()` sem prop drilling.
 *
 * @returns O modal de despesa controlado pelo store.
 */
export function ExpenseSheetHost(): ReactElement {
  const isOpen = useExpenseSheetStore((state) => state.isOpen);
  const close = useExpenseSheetStore((state) => state.close);
  const controller = useExpenseForm();
  const sheetRef = useRef<BottomSheetModal>(null);
  const { reset } = controller;

  useEffect(() => {
    if (isOpen) {
      sheetRef.current?.present();
    } else {
      sheetRef.current?.dismiss();
    }
  }, [isOpen]);

  // `onDismiss` do modal (arrastar para baixo, backdrop, gesto) também precisa
  // sincronizar o store de volta para fechado.
  const handleClose = useCallback((): void => {
    close();
  }, [close]);

  const handleSubmit = useCallback(async (): Promise<void> => {
    const result = await controller.submit();
    if (result.ok) {
      triggerHapticNotification("success");
      close();
      reset();
    } else {
      triggerHapticNotification("error");
    }
  }, [close, controller, reset]);

  return (
    <ExpenseSheet
      ref={sheetRef}
      controller={controller}
      onClose={handleClose}
      onSubmit={() => {
        void handleSubmit();
      }}
    />
  );
}
