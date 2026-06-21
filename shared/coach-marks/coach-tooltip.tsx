/**
 * Card (tooltip) do tour: eyebrow, título, corpo com trechos em **negrito**,
 * dots de progresso (o ativo vira pílula) e rodapé (Pular/Voltar/Próximo). Um
 * caret (losango) aponta para o alvo; o posicionamento (acima/abaixo + clamp) e
 * o caret vêm dos helpers puros de geometria. Entrada anima só `translateY`.
 *
 * Herda o tema atual do Tamagui (claro/escuro) via tokens semânticos.
 */
import { useEffect, type ReactElement } from "react";

import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { Paragraph, XStack, YStack } from "tamagui";

import { useAppShellStore } from "@/core/shell/app-shell-store";
import {
  type TooltipPlacement,
} from "@/shared/coach-marks/coach-marks-geometry";
import { parseBoldSegments } from "@/shared/coach-marks/coach-marks-text";
import { motionEasings } from "@/shared/theme/motion";

/** Tamanho do losango do caret (px). */
const CARET_SIZE = 14;

/** Deslocamento vertical inicial da animação de entrada (px). */
const ENTRY_TRANSLATE_Y = 12;

/** Duração da animação de entrada do tooltip (ms). */
const ENTRY_DURATION_MS = 260;

/** Largura da pílula do dot ativo (px). */
const ACTIVE_DOT_WIDTH = 18;

/** Diâmetro dos dots inativos (px). */
const DOT_SIZE = 6;

/** Props do tooltip do tour. */
export interface CoachTooltipProps {
  /** Posicionamento calculado (top/left/width/below/caretX). */
  readonly placement: TooltipPlacement;
  /** Texto do eyebrow (ex.: "PASSO 2 DE 8" ou "BEM-VINDO AO AURAXIS"). */
  readonly eyebrow: string;
  /** Título do passo. */
  readonly title: string;
  /** Corpo do passo (com marcadores `**negrito**`). */
  readonly body: string;
  /** Índice (0-based) do passo atual. */
  readonly index: number;
  /** Total de passos (para os dots e o eyebrow). */
  readonly total: number;
  /** Mostra o botão "Voltar" (passos 2..8). */
  readonly showBack: boolean;
  /** Rótulo do botão de avanço ("Próximo" ou "Começar"). */
  readonly primaryLabel: string;
  /** Chave de re-entrada — anima a entrada sempre que muda (ex.: o índice). */
  readonly animationKey: number;
  /** Avança/conclui. */
  readonly onNext: () => void;
  /** Volta um passo. */
  readonly onBack: () => void;
  /** Encerra o tour. */
  readonly onSkip: () => void;
}

/**
 * Renderiza o corpo do passo quebrando os trechos `**negrito**` em `Paragraph`
 * inline com o peso correto.
 *
 * @param props Texto do corpo.
 * @returns Parágrafo com segmentos normais/negrito.
 */
function TooltipBody({ body }: { readonly body: string }): ReactElement {
  const segments = parseBoldSegments(body);
  return (
    <Paragraph fontFamily="$body" fontSize="$3" color="$muted" lineHeight="$3">
      {segments.map((segment, segmentIndex) => (
        <Paragraph
          key={segmentIndex}
          fontFamily="$body"
          fontSize="$3"
          lineHeight="$3"
          color={segment.bold ? "$color" : "$muted"}
          fontWeight={segment.bold ? "$7" : "$4"}
        >
          {segment.text}
        </Paragraph>
      ))}
    </Paragraph>
  );
}

/**
 * Dots de progresso: o índice ativo vira uma pílula (mais larga).
 *
 * @param props Índice atual e total.
 * @returns Linha de dots.
 */
function ProgressDots({
  index,
  total,
}: {
  readonly index: number;
  readonly total: number;
}): ReactElement {
  return (
    <XStack gap="$2" alignItems="center" testID="coach-tooltip-dots">
      {Array.from({ length: total }).map((_unused, dotIndex) => {
        const isActive = dotIndex === index;
        return (
          <YStack
            key={dotIndex}
            height={DOT_SIZE}
            width={isActive ? ACTIVE_DOT_WIDTH : DOT_SIZE}
            borderRadius="$10"
            backgroundColor={isActive ? "$primary" : "$borderColor"}
          />
        );
      })}
    </XStack>
  );
}

/**
 * Caret (losango) apontando para o alvo. Posicionado em coordenadas de janela
 * sobre a borda superior/inferior do card conforme `placement.below`.
 *
 * @param props Posicionamento do tooltip.
 * @returns Losango do caret, ou nada quando não há alvo.
 */
function TooltipCaret({
  placement,
}: {
  readonly placement: TooltipPlacement;
}): ReactElement | null {
  if (placement.caretX === null) {
    return null;
  }
  const verticalEdge = placement.below
    ? { top: -CARET_SIZE / 2 }
    : { bottom: -CARET_SIZE / 2 };
  return (
    <YStack
      testID="coach-tooltip-caret"
      position="absolute"
      left={placement.caretX - placement.left - CARET_SIZE / 2}
      {...verticalEdge}
      width={CARET_SIZE}
      height={CARET_SIZE}
      rotate="45deg"
      backgroundColor="$surfaceCard"
      borderRadius="$1"
    />
  );
}

/**
 * Cabeçalho do tooltip: eyebrow (uppercase, cor de marca) + botão "Pular".
 *
 * @param props Texto do eyebrow e callback de pular.
 * @returns Linha de cabeçalho do tooltip.
 */
function TooltipHeader({
  eyebrow,
  onSkip,
}: {
  readonly eyebrow: string;
  readonly onSkip: () => void;
}): ReactElement {
  return (
    <XStack justifyContent="space-between" alignItems="center" gap="$3">
      <Paragraph
        flex={1}
        fontFamily="$heading"
        fontSize="$1"
        fontWeight="$8"
        color="$primary"
        letterSpacing={1}
        textTransform="uppercase"
      >
        {eyebrow}
      </Paragraph>
      <YStack
        accessibilityRole="button"
        accessibilityLabel="Pular tour"
        testID="coach-tooltip-skip"
        hitSlop={12}
        paddingVertical="$1"
        paddingHorizontal="$2"
        onPress={onSkip}
        pressStyle={{ opacity: 0.6 }}
      >
        <Paragraph fontFamily="$body" fontSize="$2" fontWeight="$6" color="$muted">
          Pular
        </Paragraph>
      </YStack>
    </XStack>
  );
}

/** Props do rodapé de navegação do tooltip. */
interface TooltipFooterProps {
  readonly index: number;
  readonly total: number;
  readonly showBack: boolean;
  readonly primaryLabel: string;
  readonly onNext: () => void;
  readonly onBack: () => void;
}

/**
 * Rodapé do tooltip: dots de progresso + botões "Voltar"/"Próximo". Ambos os
 * botões respeitam o alvo de toque mínimo de 44px.
 *
 * @param props Estado de progresso e callbacks de navegação.
 * @returns Linha de rodapé do tooltip.
 */
function TooltipFooter({
  index,
  total,
  showBack,
  primaryLabel,
  onNext,
  onBack,
}: TooltipFooterProps): ReactElement {
  return (
    <XStack
      justifyContent="space-between"
      alignItems="center"
      gap="$3"
      marginTop="$2"
    >
      <ProgressDots index={index} total={total} />
      <XStack gap="$2" alignItems="center">
        {showBack ? (
          <YStack
            accessibilityRole="button"
            accessibilityLabel="Voltar"
            testID="coach-tooltip-back"
            minWidth={44}
            minHeight={44}
            alignItems="center"
            justifyContent="center"
            paddingHorizontal="$3"
            borderRadius="$4"
            backgroundColor="$surfaceRaised"
            pressStyle={{ opacity: 0.7 }}
            onPress={onBack}
          >
            <Paragraph
              fontFamily="$body"
              fontSize="$3"
              fontWeight="$6"
              color="$color"
            >
              Voltar
            </Paragraph>
          </YStack>
        ) : null}
        <YStack
          accessibilityRole="button"
          accessibilityLabel={primaryLabel}
          testID="coach-tooltip-next"
          minWidth={44}
          minHeight={44}
          alignItems="center"
          justifyContent="center"
          paddingHorizontal="$4"
          borderRadius="$4"
          backgroundColor="$primary"
          pressStyle={{ backgroundColor: "$primaryPressed", opacity: 0.95 }}
          onPress={onNext}
        >
          <Paragraph
            fontFamily="$body"
            fontSize="$3"
            fontWeight="$7"
            color="$actionPrimaryForeground"
          >
            {primaryLabel}
          </Paragraph>
        </YStack>
      </XStack>
    </XStack>
  );
}

/**
 * Animação de entrada do tooltip: apenas `translateY` (sem fade por opacidade,
 * que poderia "sumir" em captura/splash). Reentra a cada `animationKey`.
 *
 * @param animationKey Chave de reentrada (tipicamente o índice do passo).
 * @returns Estilo animado a aplicar no card.
 */
const useTooltipEntry = (animationKey: number) => {
  const reducedMotion = useAppShellStore((state) => state.reducedMotionEnabled);
  const translateY = useSharedValue(reducedMotion ? 0 : ENTRY_TRANSLATE_Y);

  useEffect(() => {
    if (reducedMotion) {
      translateY.value = 0;
      return;
    }
    translateY.value = ENTRY_TRANSLATE_Y;
    translateY.value = withTiming(0, {
      duration: ENTRY_DURATION_MS,
      easing: Easing.bezier(...motionEasings.emphasized),
    });
  }, [animationKey, reducedMotion, translateY]);

  return useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));
};

/**
 * Tooltip do tour. Renderiza o card posicionado em coordenadas de janela com
 * caret, conteúdo e controles de navegação.
 *
 * @param props Conteúdo, posicionamento e callbacks.
 * @returns Card animado do tooltip.
 */
export function CoachTooltip(props: CoachTooltipProps): ReactElement {
  const {
    placement,
    eyebrow,
    title,
    body,
    index,
    total,
    showBack,
    primaryLabel,
    animationKey,
    onNext,
    onBack,
    onSkip,
  } = props;

  const animatedStyle = useTooltipEntry(animationKey);

  return (
    <Animated.View
      testID="coach-tooltip"
      style={[
        {
          position: "absolute",
          top: placement.top,
          left: placement.left,
          width: placement.width,
        },
        animatedStyle,
      ]}
    >
      <YStack
        backgroundColor="$surfaceCard"
        borderRadius="$6"
        borderWidth={1}
        borderColor="$borderColor"
        padding="$4"
        gap="$2"
        {...{ elevation: 12 }}
      >
        <TooltipCaret placement={placement} />
        <TooltipHeader eyebrow={eyebrow} onSkip={onSkip} />
        <Paragraph
          fontFamily="$heading"
          fontSize="$6"
          fontWeight="$8"
          color="$color"
          letterSpacing={-0.3}
        >
          {title}
        </Paragraph>
        <TooltipBody body={body} />
        <TooltipFooter
          index={index}
          total={total}
          showBack={showBack}
          primaryLabel={primaryLabel}
          onNext={onNext}
          onBack={onBack}
        />
      </YStack>
    </Animated.View>
  );
}
