import type { AxiosInstance } from "axios";

import { createQuestionnaireService } from "@/features/questionnaire/services/questionnaire-service";

const createClient = (): jest.Mocked<Pick<AxiosInstance, "get" | "post">> => {
  return {
    get: jest.fn(),
    post: jest.fn(),
  };
};

describe("questionnaireService", () => {
  it("carrega questionario aceitando os dois formatos de texto do backend", async () => {
    const client = createClient();
    client.get.mockResolvedValue({
      data: {
        data: {
          questions: [
            {
              id: 1,
              question: "Qual seu horizonte?",
              options: [
                { id: 10, text: "Curto", points: 1 },
                { id: 11, text: "Longo", points: 3 },
              ],
            },
            {
              id: 2,
              text: "Como reage ao risco?",
              options: [{ id: 20, text: "Bem", points: 2 }],
            },
            {
              id: 3,
              options: [{ id: 30, text: "Tanto faz", points: 1 }],
            },
          ],
        },
      },
    });

    const service = createQuestionnaireService(client as unknown as AxiosInstance);
    const result = await service.getQuestionnaire();

    expect(client.get).toHaveBeenCalledWith("/user/profile/questionnaire");
    expect(result.questions).toEqual([
      expect.objectContaining({ id: 1, text: "Qual seu horizonte?" }),
      expect.objectContaining({ id: 2, text: "Como reage ao risco?" }),
      expect.objectContaining({ id: 3, text: "" }),
    ]);
  });

  it("envia respostas e normaliza o resultado", async () => {
    const client = createClient();
    client.post.mockResolvedValue({
      data: {
        data: {
          suggested_profile: "entusiasta",
          score: 22,
        },
      },
    });

    const service = createQuestionnaireService(client as unknown as AxiosInstance);
    const result = await service.submitQuestionnaire({ answers: [11, 20] });

    expect(client.post).toHaveBeenCalledWith("/user/profile/questionnaire", {
      answers: [11, 20],
    });
    expect(result).toEqual({
      suggestedProfile: "entusiasta",
      score: 22,
    });
  });
});
