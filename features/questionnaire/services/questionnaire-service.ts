import type { AxiosInstance } from "axios";

import { unwrapEnvelopeData } from "@/core/http/contracts";
import { httpClient } from "@/core/http/http-client";
import type {
  QuestionnaireCollection,
  QuestionnaireQuestion,
  QuestionnaireResult,
  SubmitQuestionnaireCommand,
} from "@/features/questionnaire/contracts";
import { apiContractMap } from "@/shared/contracts/api-contract-map";

interface QuestionnaireQuestionPayload {
  readonly id: number;
  readonly text?: string;
  readonly question?: string;
  readonly options: {
    readonly id: number;
    readonly text: string;
    readonly points: number;
  }[];
}

const mapQuestion = (
  payload: QuestionnaireQuestionPayload,
): QuestionnaireQuestion => {
  return {
    id: payload.id,
    text: payload.text ?? payload.question ?? "",
    options: payload.options,
  };
};

export const createQuestionnaireService = (client: AxiosInstance) => {
  return {
    getQuestionnaire: async (): Promise<QuestionnaireCollection> => {
      const response = await client.get(apiContractMap.userQuestionnaireGet.path);
      const payload = unwrapEnvelopeData<{
        readonly questions: QuestionnaireQuestionPayload[];
      }>(response.data);
      return {
        questions: payload.questions.map(mapQuestion),
      };
    },
    submitQuestionnaire: async (
      command: SubmitQuestionnaireCommand,
    ): Promise<QuestionnaireResult> => {
      const response = await client.post(
        apiContractMap.userQuestionnaireSubmit.path,
        {
          answers: command.answers,
        },
      );
      const payload = unwrapEnvelopeData<{
        readonly suggested_profile: string;
        readonly score: number;
      }>(response.data);
      return {
        suggestedProfile: payload.suggested_profile,
        score: payload.score,
      };
    },
  };
};

export const questionnaireService = createQuestionnaireService(httpClient);
