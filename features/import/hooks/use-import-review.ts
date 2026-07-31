import { useCallback, useMemo, useState } from "react";

import type {
  ImportCompletions,
  ImportMissingField,
  ImportTransactionDraft,
} from "@/features/import/contracts";

/** Uma transação incompleta e o que o usuário já respondeu sobre ela. */
export interface ImportReviewCard {
  readonly draft: ImportTransactionDraft;
  readonly answers: Readonly<Partial<Record<ImportMissingField, string>>>;
  /** Todos os campos faltantes têm resposta não vazia. */
  readonly isResolved: boolean;
}

export interface ImportReviewState {
  readonly cards: readonly ImportReviewCard[];
  readonly currentIndex: number;
  readonly currentCard: ImportReviewCard | null;
  readonly totalCount: number;
  readonly resolvedCount: number;
  readonly pendingCount: number;
  readonly isComplete: boolean;
  /** Payload pronto para o `confirm`, só com o que foi respondido. */
  readonly completions: ImportCompletions;
  readonly answer: (
    draftId: string,
    field: ImportMissingField,
    value: string,
  ) => void;
  readonly goToNext: () => void;
  readonly goToPrevious: () => void;
  readonly reset: () => void;
}

type AnswerMap = Record<string, Partial<Record<ImportMissingField, string>>>;

/**
 * Um campo só conta como respondido quando tem conteúdo de verdade: string
 * vazia aqui viraria 422 no backend, que valida com as mesmas regras do v1.
 */
const isAnswered = (value: string | undefined): boolean =>
  typeof value === "string" && value.trim().length > 0;

const buildCard = (
  draft: ImportTransactionDraft,
  answers: Partial<Record<ImportMissingField, string>>,
): ImportReviewCard => ({
  draft,
  answers,
  isResolved: draft.missingFields.every((field) => isAnswered(answers[field])),
});

/**
 * Estado da conferência de linhas incompletas (#760): um card por transação,
 * contadores de pendência e o payload de `completions` que o confirm espera.
 *
 * @param drafts Transações selecionadas que voltaram com `missing_fields`.
 * @returns Estado e handlers da conferência.
 */
export function useImportReview(
  drafts: readonly ImportTransactionDraft[],
): ImportReviewState {
  const [answersByDraft, setAnswersByDraft] = useState<AnswerMap>({});
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  const cards = useMemo(
    (): readonly ImportReviewCard[] =>
      drafts.map((draft) => buildCard(draft, answersByDraft[draft.id] ?? {})),
    [drafts, answersByDraft],
  );

  const resolvedCount = cards.filter((card) => card.isResolved).length;

  const completions = useMemo((): ImportCompletions => {
    const payload: AnswerMap = {};
    for (const card of cards) {
      const answered = card.draft.missingFields.filter((field) =>
        isAnswered(card.answers[field]),
      );
      if (answered.length === 0) {
        continue;
      }
      payload[card.draft.id] = Object.fromEntries(
        answered.map((field) => [field, (card.answers[field] ?? "").trim()]),
      );
    }
    return payload;
  }, [cards]);

  const answer = useCallback(
    (draftId: string, field: ImportMissingField, value: string): void => {
      setAnswersByDraft((current) => ({
        ...current,
        [draftId]: { ...current[draftId], [field]: value },
      }));
    },
    [],
  );

  const goToNext = useCallback((): void => {
    setCurrentIndex((index) => Math.min(drafts.length - 1, index + 1));
  }, [drafts.length]);

  const goToPrevious = useCallback((): void => {
    setCurrentIndex((index) => Math.max(0, index - 1));
  }, []);

  const reset = useCallback((): void => {
    setAnswersByDraft({});
    setCurrentIndex(0);
  }, []);

  return {
    cards,
    currentIndex,
    currentCard: cards[currentIndex] ?? null,
    totalCount: cards.length,
    resolvedCount,
    pendingCount: cards.length - resolvedCount,
    isComplete: cards.length > 0 && resolvedCount === cards.length,
    completions,
    answer,
    goToNext,
    goToPrevious,
    reset,
  };
}
