import {
  type ComponentProps,
  type ReactElement,
  type ReactNode,
  useCallback,
} from "react";
import type { GestureResponderEvent } from "react-native";

import { Button, Paragraph, styled } from "tamagui";

import {
  borderWidths,
  buttonSizing,
  type ButtonSizeKey,
} from "@/config/design-tokens";
import { useResolvedTheme } from "@/core/shell/use-resolved-theme";
import {
  type HapticImpactTone,
  triggerHapticImpact,
} from "@/shared/feedback/haptics";
import { darkSemanticGlows, lightSemanticGlows } from "@/shared/theme";

// Botões pill (raio total) — paridade com os CTAs do web ("Entrar na
// Auraxis", chips de período do dashboard). Altura e padding vêm de
// `buttonSizing` (token) por tamanho — antes os frames herdavam o padding
// apertado do `Button` do Tamagui e o texto ficava "sufocado". O press
// aplica um leve `scale` via `pressStyle` (sem wrapper, para não quebrar o
// `flex` de botões lado a lado).
const PrimaryButtonFrame = styled(Button, {
  backgroundColor: "$primary",
  borderRadius: "$5",
  pressStyle: {
    backgroundColor: "$primaryPressed",
    scale: 0.97,
  },
});

const SecondaryButtonFrame = styled(Button, {
  backgroundColor: "transparent",
  borderRadius: "$5",
  borderColor: "$borderColor",
  borderWidth: borderWidths.hairline,
  pressStyle: {
    backgroundColor: "$surfaceRaised",
    borderColor: "$borderColorHover",
    scale: 0.97,
  },
});

const DangerButtonFrame = styled(Button, {
  backgroundColor: "$danger",
  borderRadius: "$5",
  pressStyle: {
    backgroundColor: "$dangerStrong",
    scale: 0.97,
  },
});

const ButtonLabel = styled(Paragraph, {
  fontFamily: "$body",
  fontWeight: "$6",
  textAlign: "center",
});

type FrameProps = ComponentProps<typeof PrimaryButtonFrame>;
type ButtonGlow = (typeof lightSemanticGlows)[keyof typeof lightSemanticGlows];

export type AppButtonTone = "primary" | "secondary" | "danger";

export interface AppButtonProps extends Omit<FrameProps, "children"> {
  readonly children: ReactNode;
  readonly tone?: AppButtonTone;
  /**
   * Tamanho do CTA. `md` (default) = altura 48 com respiro confortável;
   * `sm` para ações secundárias densas; `lg` para CTAs de destaque.
   */
  readonly size?: ButtonSizeKey;
  /**
   * Aplica o glow de marca (sombra colorida) sob o botão — usar em CTAs
   * primários de destaque (ex.: "Entrar", "Assinar"). Off por padrão.
   */
  readonly glow?: boolean;
  /** Estica o botão para a largura disponível. */
  readonly fullWidth?: boolean;
  /**
   * Tactile feedback fired on press-in. Defaults to `"light"` for primary
   * tone, `"medium"` for danger and `"none"` for secondary — matching
   * mobile UX conventions (primary CTA = strongest signal, destructive
   * action = stronger). Pass `"none"` to opt out.
   */
  readonly hapticTone?: HapticImpactTone;
}

const defaultHapticTone = (tone: AppButtonTone): HapticImpactTone => {
  if (tone === "primary") {
    return "light";
  }
  if (tone === "danger") {
    return "medium";
  }
  return "none";
};

const resolveAccessibilityLabel = (
  explicit: string | undefined,
  children: ReactNode,
): string | undefined => {
  if (explicit) {
    return explicit;
  }
  if (typeof children === "string") {
    return children;
  }
  if (typeof children === "number") {
    return String(children);
  }
  return undefined;
};

const resolveButtonGlow = (
  glow: boolean,
  tone: AppButtonTone,
  glows: typeof lightSemanticGlows,
): ButtonGlow | Record<string, never> => {
  if (!glow) {
    return {};
  }
  return glows[tone === "danger" ? "danger" : "brand"];
};

const renderButtonContent = (
  children: ReactNode,
  tone: AppButtonTone,
  fontToken: string,
): ReactNode => {
  if (typeof children !== "string" && typeof children !== "number") {
    return children;
  }
  const color = tone === "primary" ? "$actionPrimaryForeground" : "$color";
  return (
    <ButtonLabel color={color} fontSize={fontToken}>
      {children}
    </ButtonLabel>
  );
};

const renderButtonFrame = (
  tone: AppButtonTone,
  frameProps: FrameProps,
  content: ReactNode,
): ReactElement => {
  if (tone === "secondary") {
    return (
      <SecondaryButtonFrame {...frameProps}>{content}</SecondaryButtonFrame>
    );
  }
  if (tone === "danger") {
    return <DangerButtonFrame {...frameProps}>{content}</DangerButtonFrame>;
  }
  return <PrimaryButtonFrame {...frameProps}>{content}</PrimaryButtonFrame>;
};

/**
 * Shared button wrapper aligned to the Auraxis Tamagui theme.
 *
 * Fires tactile feedback on press-in via {@link triggerHapticImpact} so
 * every CTA gets free haptics without each call site importing
 * `expo-haptics` directly. The press-scale comes from Tamagui `pressStyle`
 * (no extra view), preserving caller layout such as `flex`.
 *
 * @param props Button content, tone, size, glow, and optional haptic override.
 * @returns Themed mobile button.
 */
export function AppButton({
  children,
  tone = "primary",
  size = "md",
  glow = false,
  fullWidth = false,
  hapticTone,
  onPressIn,
  accessibilityLabel,
  accessibilityRole,
  accessibilityHint,
  accessibilityState,
  disabled,
  ...rest
}: AppButtonProps): ReactElement {
  const resolvedHapticTone = hapticTone ?? defaultHapticTone(tone);
  const resolvedTheme = useResolvedTheme();
  const glows =
    resolvedTheme === "auraxis_dark" ? darkSemanticGlows : lightSemanticGlows;

  const handlePressIn = useCallback(
    (event: GestureResponderEvent): void => {
      triggerHapticImpact(resolvedHapticTone);
      onPressIn?.(event);
    },
    [onPressIn, resolvedHapticTone],
  );

  const sizing = buttonSizing[size];
  const sharedProps: FrameProps = {
    ...rest,
    ...resolveButtonGlow(glow, tone, glows),
    height: sizing.minHeight,
    paddingHorizontal: sizing.px,
    width: fullWidth ? "100%" : rest.width,
    disabled,
    accessibilityLabel: resolveAccessibilityLabel(accessibilityLabel, children),
    accessibilityRole: accessibilityRole ?? "button",
    accessibilityHint,
    accessibilityState: { disabled: Boolean(disabled), ...accessibilityState },
    onPressIn: handlePressIn,
  };

  return renderButtonFrame(
    tone,
    sharedProps,
    renderButtonContent(children, tone, sizing.fontToken),
  );
}
