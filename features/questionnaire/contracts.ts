export interface QuestionnaireOption {
  readonly id: number;
  readonly text: string;
  readonly points: number;
}

export interface QuestionnaireQuestion {
  readonly id: number;
  readonly text: string;
  readonly options: QuestionnaireOption[];
}

export interface QuestionnaireCollection {
  readonly questions: QuestionnaireQuestion[];
}

export interface SubmitQuestionnaireCommand {
  readonly answers: number[];
}

export interface QuestionnaireResult {
  readonly suggestedProfile: string;
  readonly score: number;
}
