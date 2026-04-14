import { useCallback, useRef } from "react";

import type { TextInput } from "react-native";

export type TextInputRef = React.RefObject<TextInput | null>;

export interface FormFocusManager {
  /** Returns a ref callback to attach to a TextInput. */
  getRef: (fieldName: string) => TextInputRef;
  /** Imperatively focuses the next registered field. */
  focusNext: (currentFieldName: string) => void;
  /** Imperatively focuses a specific field by name. */
  focus: (fieldName: string) => void;
}

/**
 * Manages focus traversal for a set of form fields.
 *
 * Enables keyboard-driven navigation: the `returnKeyType="next"` + `onSubmitEditing`
 * pattern for moving between inputs without tapping.
 *
 * @param fieldOrder Ordered list of field names defining the tab order.
 * @returns Focus manager with ref accessors and imperative focus helpers.
 *
 * @example
 * ```tsx
 * const focusManager = useFormFocus(["email", "password"]);
 *
 * const emailRef = focusManager.getRef("email");
 * const passwordRef = focusManager.getRef("password");
 *
 * // In JSX:
 * // <TextInput ref={emailRef} returnKeyType="next"
 * //   onSubmitEditing={() => focusManager.focusNext("email")} />
 * // <TextInput ref={passwordRef} returnKeyType="done" />
 * ```
 */
export const useFormFocus = (fieldOrder: string[]): FormFocusManager => {
  const refs = useRef<Record<string, TextInputRef>>({});

  const getRef = useCallback((fieldName: string): TextInputRef => {
    if (!refs.current[fieldName]) {
      refs.current[fieldName] = { current: null };
    }

    return refs.current[fieldName] as TextInputRef;
  }, []);

  const focus = useCallback((fieldName: string): void => {
    refs.current[fieldName]?.current?.focus();
  }, []);

  const focusNext = useCallback((currentFieldName: string): void => {
    const currentIndex = fieldOrder.indexOf(currentFieldName);

    if (currentIndex === -1) {
      return;
    }

    const nextFieldName = fieldOrder[currentIndex + 1];

    if (nextFieldName) {
      focus(nextFieldName);
    }
  }, [fieldOrder, focus]);

  return {
    getRef,
    focusNext,
    focus,
  };
};
