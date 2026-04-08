import { createApiQuery } from "@/core/query/create-api-query";
import { queryKeys } from "@/core/query/query-keys";
import type { QuestionnaireCollection } from "@/features/questionnaire/contracts";
import { questionnaireService } from "@/features/questionnaire/services/questionnaire-service";

export const useQuestionnaireQuery = () => {
  return createApiQuery<QuestionnaireCollection>(
    queryKeys.questionnaire.questions(),
    () => questionnaireService.getQuestionnaire(),
  );
};
