import { useCallback, useEffect, useRef, useState } from "react";
import { Alert } from "react-native";
import { useNavigation } from "expo-router";

/**
 * Triggered when the user picks one of the three actions on the leave
 * prompt. The hook itself doesn't navigate — it only resolves which
 * outcome the page should apply.
 */
export type LeaveOutcome = "save-and-leave" | "discard-and-leave" | "stay";

export interface LeaveWithoutSavePromptOptions {
  /** Reactive flag from the screen describing whether a result is on
   *  screen but has not been saved. The prompt only fires when true. */
  readonly isDirty: boolean;
  /** Async handler invoked when the user picks "Salvar e sair". Resolve
   *  on success (the navigation proceeds) or reject to keep the user on
   *  the screen. */
  readonly onSave: () => Promise<void>;
  /** Optional handler invoked when the user picks "Descartar e sair". */
  readonly onDiscard?: () => void;
}

interface AlertHandle {
  readonly alert: typeof Alert.alert;
}

/**
 * Intercepts the Expo Router navigation event when the user attempts to
 * leave a tool screen with an unsaved simulation result (DEC-196 UX
 * contract). Shows a native three-button modal:
 *   • Salvar e sair
 *   • Descartar e sair
 *   • Cancelar
 *
 * Implementation notes:
 *  - Uses React Navigation's `beforeRemove` event under the hood, which
 *    Expo Router exposes through `useNavigation`.
 *  - The hook keeps a single in-flight promise so the user can't queue
 *    multiple prompts by tapping back twice quickly.
 *  - The `Alert.alert` API is injectable via the optional second
 *    argument so unit tests can drive the buttons deterministically
 *    without mocking the global Alert.
 *
 * @param options Reactive dirty flag and save/discard handlers.
 * @param handle  Optional injectable Alert.alert (unit-test seam).
 * @returns Reactive `isSaving` flag plus `confirmLeave()` which
 *  resolves to the user's outcome, useful when the screen ships its
 *  own custom Cancelar button.
 */
interface SavingState {
  readonly setIsSaving: (value: boolean) => void;
  readonly setSaveError: (error: unknown | null) => void;
}

const handleSaveAndLeave = (
  optionsRef: { current: LeaveWithoutSavePromptOptions },
  state: SavingState,
  resolve: (outcome: LeaveOutcome) => void,
): void => {
  state.setIsSaving(true);
  state.setSaveError(null);
  optionsRef.current
    .onSave()
    .then(() => {
      state.setIsSaving(false);
      resolve("save-and-leave");
    })
    .catch((error: unknown) => {
      state.setIsSaving(false);
      state.setSaveError(error);
      resolve("stay");
    });
};

const buildAlertButtons = (
  optionsRef: { current: LeaveWithoutSavePromptOptions },
  state: SavingState,
  resolve: (outcome: LeaveOutcome) => void,
): Parameters<typeof Alert.alert>[2] => [
  { text: "Cancelar", style: "cancel", onPress: () => resolve("stay") },
  {
    text: "Descartar e sair",
    style: "destructive",
    onPress: () => {
      optionsRef.current.onDiscard?.();
      resolve("discard-and-leave");
    },
  },
  {
    text: "Salvar e sair",
    onPress: () => handleSaveAndLeave(optionsRef, state, resolve),
  },
];

export const useLeaveWithoutSavePrompt = (
  options: LeaveWithoutSavePromptOptions,
  handle: AlertHandle = { alert: Alert.alert },
): {
  readonly isSaving: boolean;
  readonly saveError: unknown | null;
  readonly confirmLeave: () => Promise<LeaveOutcome>;
} => {
  const navigation = useNavigation();
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<unknown | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const showPrompt = useCallback((): Promise<LeaveOutcome> => {
    return new Promise((resolve) => {
      handle.alert(
        "Salvar simulação?",
        "Você ainda não salvou esta simulação. Se sair agora, ela será descartada.",
        buildAlertButtons(
          optionsRef,
          { setIsSaving, setSaveError },
          resolve,
        ),
        { cancelable: true, onDismiss: () => resolve("stay") },
      );
    });
  }, [handle]);

  useEffect(() => {
    const unsubscribe = navigation.addListener(
      "beforeRemove" as never,
      (event: { preventDefault: () => void; data?: { action?: unknown } }) => {
        if (!optionsRef.current.isDirty) {
          return;
        }
        event.preventDefault();
        void showPrompt().then((outcome) => {
          if (outcome === "stay") {
            return;
          }
          // Re-dispatch the navigation action that the user originally
          // requested, but flip our dirty flag off so this listener
          // does not fire again on the next tick.
          optionsRef.current = { ...optionsRef.current, isDirty: false };
          const action = event.data?.action;
          if (action !== undefined) {
            (navigation as { dispatch: (action: unknown) => void }).dispatch(action);
          }
        });
      },
    );
    return unsubscribe;
  }, [navigation, showPrompt]);

  return {
    isSaving,
    saveError,
    confirmLeave: showPrompt,
  };
};
