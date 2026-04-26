import { act, renderHook } from "@testing-library/react-native";

import { useSubmitQuestionnaireMutation } from "@/features/questionnaire/hooks/use-questionnaire-mutations";
import { useQuestionnaireQuery } from "@/features/questionnaire/hooks/use-questionnaire-query";
import { useQuestionnaireScreenController } from "@/features/questionnaire/hooks/use-questionnaire-screen-controller";

const mockReplace = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: mockReplace,
    back: jest.fn(),
    canGoBack: jest.fn(() => false),
  }),
}));

jest.mock("@/features/questionnaire/hooks/use-questionnaire-query", () => ({
  useQuestionnaireQuery: jest.fn(),
}));
jest.mock("@/features/questionnaire/hooks/use-questionnaire-mutations", () => ({
  useSubmitQuestionnaireMutation: jest.fn(),
}));

const mockedUseQuery = jest.mocked(useQuestionnaireQuery);
const mockedUseSubmit = jest.mocked(useSubmitQuestionnaireMutation);

const buildQuestion = (id: number) => ({
  id,
  text: `Questao ${id}`,
  options: [
    { id: id * 10 + 1, text: "A", points: 1 },
    { id: id * 10 + 2, text: "B", points: 2 },
  ],
});

let submitStub: { mutateAsync: jest.Mock; reset: jest.Mock; isPending: boolean; error: unknown };

beforeEach(() => {
  mockReplace.mockReset();
  submitStub = {
    mutateAsync: jest.fn().mockResolvedValue({ suggestedProfile: "explorador", score: 12 }),
    reset: jest.fn(),
    isPending: false,
    error: null,
  };
  mockedUseSubmit.mockReturnValue(submitStub as never);
  mockedUseQuery.mockReturnValue({
    data: { questions: [buildQuestion(1), buildQuestion(2)] },
  } as never);
});

describe("useQuestionnaireScreenController", () => {
  it("inicia em stage intro", () => {
    const { result } = renderHook(() => useQuestionnaireScreenController());
    expect(result.current.stage).toBe("intro");
    expect(result.current.totalQuestions).toBe(2);
  });

  it("handleStart move para questions e zera index", () => {
    const { result } = renderHook(() => useQuestionnaireScreenController());
    act(() => {
      result.current.handleStart();
    });
    expect(result.current.stage).toBe("questions");
    expect(result.current.currentIndex).toBe(0);
  });

  it("handleAnswer salva resposta para a questao", () => {
    const { result } = renderHook(() => useQuestionnaireScreenController());
    act(() => {
      result.current.handleStart();
    });
    act(() => {
      result.current.handleAnswer(1, 11);
    });
    expect(result.current.answers.get(1)).toBe(11);
  });

  it("handleNext avanca para a proxima questao", async () => {
    const { result } = renderHook(() => useQuestionnaireScreenController());
    act(() => {
      result.current.handleStart();
    });
    await act(async () => {
      await result.current.handleNext();
    });
    expect(result.current.currentIndex).toBe(1);
  });

  it("handleNext na ultima questao submete e abre stage result", async () => {
    const { result } = renderHook(() => useQuestionnaireScreenController());
    act(() => {
      result.current.handleStart();
    });
    act(() => {
      result.current.handleAnswer(1, 12);
    });
    await act(async () => {
      await result.current.handleNext();
    });
    act(() => {
      result.current.handleAnswer(2, 22);
    });
    await act(async () => {
      await result.current.handleNext();
    });
    expect(submitStub.mutateAsync).toHaveBeenCalledWith({ answers: [12, 22] });
    expect(result.current.stage).toBe("result");
  });

  it("handleBack retorna para a questao anterior", async () => {
    const { result } = renderHook(() => useQuestionnaireScreenController());
    act(() => {
      result.current.handleStart();
    });
    await act(async () => {
      await result.current.handleNext();
    });
    act(() => {
      result.current.handleBack();
    });
    expect(result.current.currentIndex).toBe(0);
  });

  it("handleFinish redireciona para /perfil", () => {
    const { result } = renderHook(() => useQuestionnaireScreenController());
    act(() => {
      result.current.handleFinish();
    });
    expect(mockReplace).toHaveBeenCalledWith("/perfil");
  });

  it("dismissSubmitError reseta a mutation", () => {
    const { result } = renderHook(() => useQuestionnaireScreenController());
    act(() => {
      result.current.dismissSubmitError();
    });
    expect(submitStub.reset).toHaveBeenCalled();
  });

  it("nao avanca para result quando submit falha", async () => {
    submitStub.mutateAsync.mockRejectedValueOnce(new Error("boom"));
    const { result } = renderHook(() => useQuestionnaireScreenController());
    act(() => {
      result.current.handleStart();
    });
    act(() => {
      result.current.handleAnswer(1, 12);
    });
    await act(async () => {
      await result.current.handleNext();
    });
    act(() => {
      result.current.handleAnswer(2, 22);
    });
    await act(async () => {
      await result.current.handleNext();
    });
    expect(result.current.stage).toBe("questions");
  });
});
