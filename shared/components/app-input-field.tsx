import type { ComponentProps, ReactElement } from "react";

import { Input, Label, Paragraph, YStack, styled } from "tamagui";

import { borderWidths } from "@/config/design-tokens";

const FieldInput = styled(Input, {
  backgroundColor: "$surfaceRaised",
  borderColor: "$borderColor",
  borderWidth: borderWidths.hairline,
  borderRadius: "$1",
  color: "$color",
  fontFamily: "$body",
  fontSize: "$4",
  placeholderTextColor: "$placeholderColor",
});

export interface AppInputFieldProps
  extends Omit<ComponentProps<typeof FieldInput>, "id"> {
  readonly id: string
  readonly label: string
  readonly helperText?: string
  readonly errorText?: string
}

/**
 * Shared labeled input with helper and error copy.
 *
 * @param props Field props and support texts.
 * @returns A form field wrapper ready for mobile forms.
 */
export function AppInputField({
  id,
  label,
  helperText,
  errorText,
  ...rest
}: AppInputFieldProps): ReactElement {
  return (
    <YStack gap="$2">
      <Label htmlFor={id} color="$color" fontFamily="$body" fontSize="$3">
        {label}
      </Label>
      <FieldInput id={id} {...rest} />
      {errorText ? (
        <Paragraph color="$danger" fontFamily="$body" fontSize="$2">
          {errorText}
        </Paragraph>
      ) : null}
      {!errorText && helperText ? (
        <Paragraph color="$muted" fontFamily="$body" fontSize="$2">
          {helperText}
        </Paragraph>
      ) : null}
    </YStack>
  );
}
