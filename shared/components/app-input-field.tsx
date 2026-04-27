import { memo, type ComponentProps, type ReactElement } from "react";

import { Input, Label, YStack, styled } from "tamagui";

import { borderWidths } from "@/config/design-tokens";
import { AppFormMessage } from "@/shared/components/app-form-message";

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
  readonly id: string;
  readonly label: string;
  readonly helperText?: string;
  readonly errorText?: string;
}

/**
 * Shared labeled input with helper and error copy.
 *
 * Memoised so unchanged fields skip render when sibling fields update —
 * critical for large forms where a single keystroke would otherwise
 * re-render every input on the page.
 *
 * @param props Field props and support texts.
 * @returns A form field wrapper ready for mobile forms.
 */
const AppInputFieldComponent = ({
  id,
  label,
  helperText,
  errorText,
  accessibilityLabel,
  accessibilityHint,
  ...rest
}: AppInputFieldProps): ReactElement => {
  const resolvedHint = errorText ?? helperText;
  const hintTone = errorText ? "danger" : "muted";
  const a11yLabel = accessibilityLabel ?? label;
  const a11yHint = accessibilityHint ?? helperText;

  return (
    <YStack gap="$2">
      <Label htmlFor={id} color="$color" fontFamily="$body" fontSize="$3">
        {label}
      </Label>
      <FieldInput
        id={id}
        accessibilityLabel={a11yLabel}
        accessibilityHint={a11yHint}
        aria-invalid={Boolean(errorText)}
        {...rest}
      />
      {resolvedHint ? <AppFormMessage tone={hintTone} text={resolvedHint} /> : null}
    </YStack>
  );
};

export const AppInputField = memo(AppInputFieldComponent);
