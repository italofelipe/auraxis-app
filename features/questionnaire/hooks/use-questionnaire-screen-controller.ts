import { useRouter } from "expo-router";
import { useState } from "react";

import { appRoutes } from "@/core/navigation/routes";
import type {
  QuestionnaireQuestion,
  QuestionnaireResult,
} from "@/features/questionnaire/contracts";
import { useSubmitQuestionnaireMutation } from "@/features/questionnaire/hooks/use-questionnaire-mutations";
import { useQuestionnaireQuery } from "@/features/questionnaire/hooks/use-questionnaire-query";

export type QuestionnaireStage = "intro" | "questions" | "result";

export interface QuestionnaireScreenController {
  readonly questionnaireQuery: ReturnType<typeof useQuestionnaireQuery>;
  readonly stage: QuestionnaireStage;
  readonly currentQuestion: QuestionnaireQuestion | null;
  readonly currentIndex: number;
  readonly totalQuestions: number;
  readonly progress: number;
  readonly answers: ReadonlyMap<number, number>;
  readonly result: QuestionnaireResult | null;
  readonly isSubmitting: boolean;
  readonly submitError: unknown | null;
  readonly handleStart: () => void;
  readonly handleAnswer: (questionId: number, optionId: number) => void;
  readonly handleNext: () => Promise<void>;
  readonly handleBack: () => void;
  readonly handleFinish: () => void;
  readonly dismissSubmitError: () => void;
}

const computeProgress = (current: number, total: number): number => {
  if (total <= 0) {
    return 0;
  }
  return Math.round((current / total) * 100);
};

/**
 * Canonical controller for the investor profile questionnaire. Owns the
 * stage machine (intro / questions / result), the answer collection and
 * the submit mutation orchestration.
 */
export function useQuestionnaireScreenController(): QuestionnaireScreenController {
  const router = useRouter();
  const questionnaireQuery = useQuestionnaireQuery();
  const submitMutation = useSubmitQuestionnaireMutation();
  const [stage, setStage] = useState<QuestionnaireStage>("intro");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<ReadonlyMap<number, number>>(new Map());
  const [result, setResult] = useState<QuestionnaireResult | null>(null);

  const questions = questionnaireQuery.data?.questions ?? [];
  const totalQuestions = questions.length;
  const currentQuestion = questions[currentIndex] ?? null;

  const submit = async (): Promise<void> => {
    const orderedAnswers = questions
      .map((question) => answers.get(question.id))
      .filter((value): value is number => value !== undefined);
    try {
      const outcome = await submitMutation.mutateAsync({ answers: orderedAnswers });
      setResult(outcome);
      setStage("result");
    } catch {
      /* error preserved on submitMutation.error */
    }
  };

  return {
    questionnaireQuery,
    stage,
    currentQuestion,
    currentIndex,
    totalQuestions,
    progress: computeProgress(currentIndex, totalQuestions),
    answers,
    result,
    isSubmitting: submitMutation.isPending,
    submitError: submitMutation.error,
    handleStart: () => {
      setStage("questions");
      setCurrentIndex(0);
    },
    handleAnswer: (questionId, optionId) => {
      setAnswers((current) => {
        const next = new Map(current);
        next.set(questionId, optionId);
        return next;
      });
    },
    handleNext: async () => {
      if (currentIndex < totalQuestions - 1) {
        setCurrentIndex(currentIndex + 1);
        return;
      }
      await submit();
    },
    handleBack: () => {
      if (currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
      }
    },
    handleFinish: () => {
      router.replace(appRoutes.private.profile);
    },
    dismissSubmitError: () => {
      submitMutation.reset();
    },
  };
}
