import type { ReactElement } from "react";

import { Paragraph, XStack, YStack } from "tamagui";

import type {
  QuestionnaireQuestion,
  QuestionnaireResult,
} from "@/features/questionnaire/contracts";
import {
  useQuestionnaireScreenController,
  type QuestionnaireScreenController,
} from "@/features/questionnaire/hooks/use-questionnaire-screen-controller";
import { AppButton } from "@/shared/components/app-button";
import { AppErrorNotice } from "@/shared/components/app-error-notice";
import { AppQueryState } from "@/shared/components/app-query-state";
import { AppScreen } from "@/shared/components/app-screen";
import { AppSurfaceCard } from "@/shared/components/app-surface-card";

/**
 * Canonical investor-profile questionnaire screen for the mobile app.
 *
 * @returns Stage machine: intro / questions / result.
 */
export function QuestionnaireScreen(): ReactElement {
  const controller = useQuestionnaireScreenController();

  if (controller.stage === "intro") {
    return <IntroStage controller={controller} />;
  }

  if (controller.stage === "result") {
    return <ResultStage controller={controller} />;
  }

  return <QuestionsStage controller={controller} />;
}

interface ControllerProps {
  readonly controller: QuestionnaireScreenController;
}

function IntroStage({ controller }: ControllerProps): ReactElement {
  return (
    <AppScreen>
      <AppSurfaceCard
        title="Perfil de investidor"
        description="Responda algumas perguntas para descobrirmos o seu perfil."
      >
        <YStack gap="$3">
          <Paragraph color="$muted" fontFamily="$body" fontSize="$3">
            O resultado e usado para sugerir alocacoes e simulacoes mais
            adequadas ao seu momento financeiro.
          </Paragraph>
          <AppButton
            onPress={controller.handleStart}
            disabled={controller.totalQuestions === 0}
          >
            Comecar questionario
          </AppButton>
        </YStack>
      </AppSurfaceCard>
    </AppScreen>
  );
}

function ResultStage({ controller }: ControllerProps): ReactElement {
  return (
    <AppScreen>
      <AppSurfaceCard
        title="Pronto!"
        description="Aqui esta o seu perfil sugerido."
      >
        <YStack gap="$3">
          <ResultBody result={controller.result} />
          <AppButton onPress={controller.handleFinish}>
            Voltar para o perfil
          </AppButton>
        </YStack>
      </AppSurfaceCard>
    </AppScreen>
  );
}

function ResultBody({
  result,
}: {
  readonly result: QuestionnaireResult | null;
}): ReactElement {
  if (!result) {
    return (
      <Paragraph color="$muted" fontFamily="$body" fontSize="$3">
        Sem resultado para exibir.
      </Paragraph>
    );
  }
  return (
    <YStack gap="$2">
      <Paragraph color="$color" fontFamily="$heading" fontSize="$8">
        {result.suggestedProfile}
      </Paragraph>
      <Paragraph color="$muted" fontFamily="$body" fontSize="$3">
        Pontuacao: {result.score}
      </Paragraph>
    </YStack>
  );
}

function QuestionsStage({ controller }: ControllerProps): ReactElement {
  return (
    <AppScreen>
      <AppSurfaceCard
        title={`Questao ${controller.currentIndex + 1} de ${controller.totalQuestions}`}
        description="Selecione a alternativa que mais se aproxima da sua realidade."
      >
        <AppQueryState
          query={controller.questionnaireQuery}
          options={{
            loading: {
              title: "Carregando questionario",
              description: "Buscando as perguntas oficiais.",
            },
            empty: {
              title: "Sem questionario disponivel",
              description: "Volte mais tarde para tentar novamente.",
            },
            error: {
              fallbackTitle: "Nao foi possivel carregar",
              fallbackDescription: "Tente novamente em instantes.",
            },
            isEmpty: (data) => data.questions.length === 0,
          }}
        >
          {() => <QuestionPanel controller={controller} />}
        </AppQueryState>
      </AppSurfaceCard>
    </AppScreen>
  );
}

function QuestionPanel({ controller }: ControllerProps): ReactElement | null {
  if (!controller.currentQuestion) {
    return null;
  }
  return (
    <YStack gap="$4">
      <QuestionOptions
        question={controller.currentQuestion}
        selectedOptionId={
          controller.answers.get(controller.currentQuestion.id) ?? null
        }
        onAnswer={(optionId) =>
          controller.handleAnswer(controller.currentQuestion!.id, optionId)
        }
      />
      {controller.submitError ? (
        <AppErrorNotice
          error={controller.submitError}
          fallbackTitle="Nao foi possivel enviar"
          fallbackDescription="Tente novamente em instantes."
          secondaryActionLabel="Fechar"
          onSecondaryAction={controller.dismissSubmitError}
        />
      ) : null}
      <NavigationRow controller={controller} />
    </YStack>
  );
}

interface QuestionOptionsProps {
  readonly question: QuestionnaireQuestion;
  readonly selectedOptionId: number | null;
  readonly onAnswer: (optionId: number) => void;
}

function QuestionOptions({
  question,
  selectedOptionId,
  onAnswer,
}: QuestionOptionsProps): ReactElement {
  return (
    <YStack gap="$3">
      <Paragraph color="$color" fontFamily="$body" fontSize="$4">
        {question.text}
      </Paragraph>
      <YStack gap="$2">
        {question.options.map((option) => (
          <AppButton
            key={option.id}
            tone={selectedOptionId === option.id ? "primary" : "secondary"}
            onPress={() => onAnswer(option.id)}
          >
            {option.text}
          </AppButton>
        ))}
      </YStack>
    </YStack>
  );
}

function NavigationRow({ controller }: ControllerProps): ReactElement {
  const isLast = controller.currentIndex === controller.totalQuestions - 1;
  const hasAnswered =
    controller.currentQuestion !== null &&
    controller.answers.has(controller.currentQuestion.id);
  return (
    <XStack gap="$2" flexWrap="wrap">
      <AppButton
        tone="secondary"
        onPress={controller.handleBack}
        disabled={controller.currentIndex === 0}
      >
        Voltar
      </AppButton>
      <AppButton
        onPress={() => {
          void controller.handleNext();
        }}
        disabled={!hasAnswered || controller.isSubmitting}
      >
        {controller.isSubmitting
          ? "Enviando..."
          : isLast
            ? "Concluir"
            : "Proxima"}
      </AppButton>
    </XStack>
  );
}
