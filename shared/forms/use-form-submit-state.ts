import type { FieldValues, UseFormReturn } from "react-hook-form";

export type FormSubmitStatus = "idle" | "submitting" | "success" | "error";

export interface FormSubmitState {
  /** Whether the form is currently being submitted. */
  readonly isSubmitting: boolean;
  /** Whether the form is in any in-progress state (submitting or validating). */
  readonly isBusy: boolean;
  /** Whether the submit button should be disabled. */
  readonly isSubmitDisabled: boolean;
  /** Current lifecycle status of the last submit attempt. */
  readonly status: FormSubmitStatus;
}

/**
 * Derives canonical submit state from a React Hook Form instance.
 *
 * @param form The form instance returned by `useAppForm`.
 * @returns Normalized submit state for rendering submit controls.
 *
 * @example
 * ```tsx
 * const form = useAppForm(schema, { defaultValues });
 * const submit = useFormSubmitState(form);
 *
 * <AppButton
 *   disabled={submit.isSubmitDisabled}
 *   loading={submit.isSubmitting}
 * >
 *   Salvar
 * </AppButton>
 * ```
 */
export const useFormSubmitState = <TFieldValues extends FieldValues>(
  form: UseFormReturn<TFieldValues>,
): FormSubmitState => {
  const {
    formState: {
      isSubmitting,
      isValidating,
      isSubmitted,
      isSubmitSuccessful,
      errors,
    },
  } = form;

  const isBusy = isSubmitting || isValidating;

  const hasErrors = Object.keys(errors).length > 0;

  const isSubmitDisabled = isBusy;

  const resolveStatus = (): FormSubmitStatus => {
    if (isSubmitting) {
      return "submitting";
    }

    if (isSubmitted && isSubmitSuccessful) {
      return "success";
    }

    if (isSubmitted && hasErrors) {
      return "error";
    }

    return "idle";
  };

  return {
    isSubmitting,
    isBusy,
    isSubmitDisabled,
    status: resolveStatus(),
  };
};
