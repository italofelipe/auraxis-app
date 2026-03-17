import { createAuthApi } from "@/lib/auth-api";

describe("auth api", () => {
  it("usa o endpoint canônico de recuperação de senha", async () => {
    const post = jest.fn().mockResolvedValue({
      data: {
        message: "Email sent",
      },
    });

    const authApi = createAuthApi({ post });
    const response = await authApi.forgotPassword({
      email: "user@auraxis.com",
    });

    expect(post).toHaveBeenCalledWith("/auth/password/forgot", {
      email: "user@auraxis.com",
    });
    expect(response).toEqual({
      accepted: true,
      message: "Email sent",
    });
  });
});
