import { createAuthApi } from "@/lib/auth-api";

describe("auth api", () => {
  it("normaliza a resposta de recuperação de senha", async () => {
    const forgotPassword = jest.fn().mockResolvedValue({
      accepted: true,
      message: "Email sent",
    });

    const authApi = createAuthApi({
      login: jest.fn(),
      forgotPassword,
    });
    const response = await authApi.forgotPassword({
      email: "user@auraxis.com",
    });

    expect(forgotPassword).toHaveBeenCalledWith({
      email: "user@auraxis.com",
    });
    expect(response).toEqual({
      accepted: true,
      message: "Email sent",
    });
  });
});
