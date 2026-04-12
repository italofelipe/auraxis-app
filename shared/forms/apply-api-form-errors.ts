import type { FieldValues, Path, UseFormSetError } from "react-hook-form";

import type { ApiError } from "@/core/http/api-error";
import {
  extractFormFieldErrors,
  type FormFieldErrorMap,
} from "@/shared/forms/api-form-errors";

/**
 * Applies API field errors to a React Hook Form instance.
 */
export const applyApiFormErrors = <TFieldValues extends FieldValues>(
  error: ApiError | null | undefined,
  setError: UseFormSetError<TFieldValues>,
): FormFieldErrorMap<Extract<keyof TFieldValues, string>> => {
  const fieldErrors = extractFormFieldErrors<
    Extract<keyof TFieldValues, string>
  >(error);

  for (const [fieldName, message] of Object.entries(fieldErrors)) {
    setError(fieldName as Path<TFieldValues>, {
      type: "server",
      message,
    });
  }

  return fieldErrors;
};
