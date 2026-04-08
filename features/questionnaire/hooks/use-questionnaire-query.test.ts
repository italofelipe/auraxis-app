import type { SubmitQuestionnaireCommand } from "@/features/questionnaire/contracts";
import { queryKeys } from "@/core/query/query-keys";
import { useQuestionnaireQuery } from "@/features/questionnaire/hooks/use-questionnaire-query";
import { useSubmitQuestionnaireMutation } from "@/features/questionnaire/hooks/use-questionnaire-mutations";

const mockCreateApiQuery = jest.fn();
const mockGetQuestionnaire = jest.fn();
const mockSubmitQuestionnaire = jest.fn();
const mockUseMutation = jest.fn();
const mockUseQueryClient = jest.fn();
const mockInvalidateQueries = jest.fn();

jest.mock("@/core/query/create-api-query", () => ({
  createApiQuery: (...args: readonly unknown[]) => mockCreateApiQuery(...args),
}));

jest.mock("@tanstack/react-query", () => ({
  useMutation: (...args: readonly unknown[]) => mockUseMutation(...args),
  useQueryClient: () => mockUseQueryClient(),
}));

jest.mock("@/features/questionnaire/services/questionnaire-service", () => ({
  questionnaireService: {
    getQuestionnaire: (...args: readonly unknown[]) => mockGetQuestionnaire(...args),
    submitQuestionnaire: (...args: readonly unknown[]) => mockSubmitQuestionnaire(...args),
  },
}));

describe("questionnaire hooks", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateApiQuery.mockImplementation(
      (queryKey: readonly unknown[], queryFn: () => Promise<unknown>) => ({
        queryKey,
        queryFn,
      }),
    );
    mockUseMutation.mockImplementation((options: unknown) => options);
    mockInvalidateQueries.mockResolvedValue(undefined);
    mockUseQueryClient.mockReturnValue({
      invalidateQueries: mockInvalidateQueries,
    });
  });

  it("configura a query do questionario", async () => {
    mockGetQuestionnaire.mockResolvedValue({ questions: [] });

    const query = useQuestionnaireQuery() as unknown as {
      queryKey: readonly unknown[];
      queryFn: () => Promise<unknown>;
    };

    await expect(query.queryFn()).resolves.toEqual({ questions: [] });
    expect(query.queryKey).toEqual(queryKeys.questionnaire.questions());
  });

  it("configura a mutation e invalida os domínios dependentes", async () => {
    const command: SubmitQuestionnaireCommand = { answers: [1, 2, 3] };
    mockSubmitQuestionnaire.mockResolvedValue({
      suggestedProfile: "explorador",
      score: 12,
    });

    const mutation = useSubmitQuestionnaireMutation() as unknown as {
      mutationFn: (input: SubmitQuestionnaireCommand) => Promise<unknown>;
      onSuccess: () => Promise<void>;
    };

    await expect(mutation.mutationFn(command)).resolves.toEqual({
      suggestedProfile: "explorador",
      score: 12,
    });
    await mutation.onSuccess();
    expect(mockSubmitQuestionnaire).toHaveBeenCalledWith(command);
    expect(mockInvalidateQueries).toHaveBeenNthCalledWith(1, {
      queryKey: queryKeys.questionnaire.root,
    });
    expect(mockInvalidateQueries).toHaveBeenNthCalledWith(2, {
      queryKey: queryKeys.userProfile.root,
    });
    expect(mockInvalidateQueries).toHaveBeenNthCalledWith(3, {
      queryKey: queryKeys.bootstrap.root,
    });
  });
});
