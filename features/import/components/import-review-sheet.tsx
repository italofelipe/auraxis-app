import type { ReactElement } from "react";

import { Paragraph, XStack, YStack } from "tamagui";

import { ImportBottomSheet } from "@/features/import/components/import-bottom-sheet";
import { ImportReviewCardView } from "@/features/import/components/import-review-card";
import type { ImportReviewState } from "@/features/import/hooks/use-import-review";
import type { ImportScreenController } from "@/features/import/hooks/use-import-screen-controller";
import { AppButton } from "@/shared/components/app-button";
import { AppHeading } from "@/shared/components/app-heading";
import { useT } from "@/shared/i18n";

interface ReviewSectionProps {
  readonly review: ImportReviewState;
}

/** Contadores da conferência — sempre visíveis, como pede a especificação. */
function ReviewProgress({ review }: ReviewSectionProps): ReactElement {
  const { t } = useT();

  return (
    <XStack gap="$3" flexWrap="wrap">
      <Paragraph
        fontWeight="700"
        accessibilityLiveRegion="polite"
        testID="import-review-progress"
      >
        {t("import.review.progress", {
          resolved: review.resolvedCount,
          total: review.totalCount,
        })}
      </Paragraph>
      <Paragraph color="$mutedColor" accessibilityLiveRegion="polite">
        {t("import.review.pending", { count: review.pendingCount })}
      </Paragraph>
    </XStack>
  );
}

/** Navegação entre os cards; só aparece quando há mais de uma pendência. */
function ReviewPager({ review }: ReviewSectionProps): ReactElement | null {
  const { t } = useT();

  if (review.totalCount <= 1) {
    return null;
  }

  return (
    <XStack gap="$2">
      <AppButton
        flex={1}
        tone="secondary"
        size="sm"
        disabled={review.currentIndex === 0}
        onPress={review.goToPrevious}
      >
        {t("import.review.previous")}
      </AppButton>
      <AppButton
        flex={1}
        size="sm"
        disabled={review.currentIndex >= review.totalCount - 1}
        onPress={review.goToNext}
      >
        {t("import.review.next")}
      </AppButton>
    </XStack>
  );
}

interface ReviewActionsProps {
  readonly controller: ImportScreenController;
}

/**
 * Conclusão bloqueada enquanto houver pendência — com a explicação textual ao
 * lado, porque `disabled` sozinho não conta motivo a ninguém.
 */
function ReviewActions({ controller }: ReviewActionsProps): ReactElement {
  const { t } = useT();
  const { review } = controller;

  return (
    <YStack gap="$3">
      {review.isComplete ? null : (
        <Paragraph color="$mutedColor" testID="import-review-blocked-hint">
          {t("import.review.blockedHint")}
        </Paragraph>
      )}
      <AppButton
        disabled={!review.isComplete || controller.isBusy}
        onPress={() => {
          void controller.handleSubmitReview();
        }}
        testID="import-review-submit"
      >
        {t("import.review.finishNow")}
      </AppButton>
      <AppButton
        tone="secondary"
        onPress={controller.handleOpenFinishLater}
        testID="import-review-finish-later"
      >
        {t("import.review.finishLater")}
      </AppButton>
      <AppButton tone="secondary" size="sm" onPress={controller.handleCancelReview}>
        {t("import.review.backToPreview")}
      </AppButton>
    </YStack>
  );
}

export interface ImportReviewSheetProps {
  readonly controller: ImportScreenController;
}

/**
 * Conferência das linhas incompletas (#760): um card por transação, contadores
 * sempre visíveis e conclusão liberada só quando nada mais estiver faltando.
 *
 * @param props Controller da tela de import.
 * @returns O sheet de conferência.
 */
export function ImportReviewSheet({
  controller,
}: ImportReviewSheetProps): ReactElement {
  const { t } = useT();
  const { review } = controller;
  const card = review.currentCard;

  return (
    <ImportBottomSheet
      visible
      onClose={controller.handleCancelReview}
      closeLabel={t("import.review.backToPreview")}
      testID="import-review-sheet"
    >
      <YStack gap="$3">
        <AppHeading level={3}>{t("import.review.modalTitle")}</AppHeading>
        <Paragraph color="$mutedColor">
          {t("import.review.modalDescription")}
        </Paragraph>
        <ReviewProgress review={review} />
        {card ? (
          <ImportReviewCardView
            card={card}
            position={review.currentIndex + 1}
            total={review.totalCount}
            onAnswer={review.answer}
          />
        ) : null}
        <ReviewPager review={review} />
        <ReviewActions controller={controller} />
      </YStack>
    </ImportBottomSheet>
  );
}
