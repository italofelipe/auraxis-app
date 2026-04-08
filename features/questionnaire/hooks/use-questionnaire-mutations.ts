import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/core/query/query-keys";
import type {
  QuestionnaireResult,
  SubmitQuestionnaireCommand,
} from "@/features/questionnaire/contracts";
import { questionnaireService } from "@/features/questionnaire/services/questionnaire-service";

export const useSubmitQuestionnaireMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<QuestionnaireResult, Error, SubmitQuestionnaireCommand>({
    mutationFn: (command) => questionnaireService.submitQuestionnaire(command),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.questionnaire.root });
      await queryClient.invalidateQueries({ queryKey: queryKeys.userProfile.root });
      await queryClient.invalidateQueries({ queryKey: queryKeys.bootstrap.root });
    },
  });
};
