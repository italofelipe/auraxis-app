import type { ApiError } from "@/core/http/api-error";

export type FormFieldErrorMap<TFieldName extends string> = Partial<
  Record<TFieldName, string>
>;

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

export const extractFormFieldErrors = <TFieldName extends string>(
  error: ApiError | null | undefined,
): FormFieldErrorMap<TFieldName> => {
  const details = error?.details;
  if (!isRecord(details)) {
    return {};
  }

  return Object.entries(details).reduce<FormFieldErrorMap<TFieldName>>(
    (accumulator, [fieldName, rawMessage]) => {
      if (typeof rawMessage === "string" && rawMessage.length > 0) {
        accumulator[fieldName as TFieldName] = rawMessage;
      }

      return accumulator;
    },
    {},
  );
};
