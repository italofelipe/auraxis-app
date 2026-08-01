import { useCallback, type ReactElement } from "react";

import { Paragraph, XStack, YStack } from "tamagui";

import type { ImportMissingField } from "@/features/import/contracts";
import type { ImportReviewCard } from "@/features/import/hooks/use-import-review";
import { AppBadge } from "@/shared/components/app-badge";
import { AppInputField } from "@/shared/components/app-input-field";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";
import { useT } from "@/shared/i18n";
import { formatShortDate } from "@/shared/utils/formatters";

export interface ImportReviewCardViewProps {
  readonly card: ImportReviewCard;
  readonly position: number;
  readonly total: number;
  readonly onAnswer: (
    draftId: string,
    field: ImportMissingField,
    value: string,
  ) => void;
}

/**
 * Um card de conferência: mostra a transação (deixando explícito se é receita
 * ou despesa) e pergunta exatamente o dado que falta.
 *
 * @param props Card, posição na fila e callback de resposta.
 * @returns O card de preenchimento.
 */
export function ImportReviewCardView({
  card,
  position,
  total,
  onAnswer,
}: ImportReviewCardViewProps): ReactElement {
  const { t } = useT();
  const { draft } = card;

  const handleDescription = useCallback(
    (value: string) => onAnswer(draft.id, "description", value),
    [draft.id, onAnswer],
  );
  const handleAmount = useCallback(
    (value: string) => onAnswer(draft.id, "amount", value),
    [draft.id, onAnswer],
  );

  const typeLabel =
    draft.type === "income"
      ? t("import.review.income")
      : t("import.review.expense");
  const missesDescription = draft.missingFields.includes("description");
  const missesAmount = draft.missingFields.includes("amount");

  return (
    <AppSurfaceCard
      title={t("import.review.cardCounter", { current: position, total })}
    >
      <YStack gap="$3" testID={`import-review-card-${draft.id}`}>
        <XStack gap="$2" flexWrap="wrap" alignItems="center">
          <AppBadge tone={draft.type === "income" ? "primary" : "danger"}>
            {typeLabel}
          </AppBadge>
          <AppBadge tone={card.isResolved ? "primary" : "danger"}>
            {card.isResolved
              ? t("import.review.resolved")
              : t("import.review.missing")}
          </AppBadge>
        </XStack>
        <YStack gap="$1">
          <Paragraph fontWeight="700">
            {missesDescription ? "—" : draft.description}
          </Paragraph>
          <Paragraph color="$mutedColor">{formatShortDate(draft.date)}</Paragraph>
          {missesAmount ? null : (
            <Paragraph fontWeight="700">R$ {draft.amount}</Paragraph>
          )}
        </YStack>
        {missesDescription ? (
          <AppInputField
            id={`import-review-description-${draft.id}`}
            label={t("import.review.askDescription")}
            placeholder={t("import.review.descriptionPlaceholder")}
            value={card.answers.description ?? ""}
            onChangeText={handleDescription}
            testID={`import-review-description-${draft.id}`}
          />
        ) : null}
        {missesAmount ? (
          <AppInputField
            id={`import-review-amount-${draft.id}`}
            label={t("import.review.askAmount")}
            placeholder={t("import.review.amountPlaceholder")}
            keyboardType="decimal-pad"
            value={card.answers.amount ?? ""}
            onChangeText={handleAmount}
            testID={`import-review-amount-${draft.id}`}
          />
        ) : null}
      </YStack>
    </AppSurfaceCard>
  );
}
