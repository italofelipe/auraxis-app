import type {
  QuestionnaireCollection,
  QuestionnaireResult,
} from "@/features/questionnaire/contracts";

export const questionnaireFixture: QuestionnaireCollection = {
  questions: [
    {
      id: 1,
      text: "Qual o seu principal objetivo ao investir?",
      options: [
        { id: 1, text: "Preservar meu patrimônio", points: 1 },
        { id: 2, text: "Crescimento moderado", points: 2 },
        { id: 3, text: "Maximizar a rentabilidade", points: 3 },
      ],
    },
  ],
};

export const questionnaireResultFixture: QuestionnaireResult = {
  suggestedProfile: "explorador",
  score: 9,
};
