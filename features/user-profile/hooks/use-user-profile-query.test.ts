import type { UpdateUserProfileCommand } from "@/features/user-profile/contracts";
import { queryKeys } from "@/core/query/query-keys";
import { useUserProfileQuery } from "@/features/user-profile/hooks/use-user-profile-query";
import { useUpdateUserProfileMutation } from "@/features/user-profile/hooks/use-user-profile-mutations";

const mockCreateApiQuery = jest.fn();
const mockGetProfile = jest.fn();
const mockUpdateProfile = jest.fn();
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

jest.mock("@/features/user-profile/services/user-profile-service", () => ({
  userProfileService: {
    getProfile: (...args: readonly unknown[]) => mockGetProfile(...args),
    updateProfile: (...args: readonly unknown[]) => mockUpdateProfile(...args),
  },
}));

describe("user-profile hooks", () => {
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

  it("configura a query do perfil", async () => {
    mockGetProfile.mockResolvedValue({ id: "usr-1" });

    const query = useUserProfileQuery() as unknown as {
      queryKey: readonly unknown[];
      queryFn: () => Promise<unknown>;
    };

    await expect(query.queryFn()).resolves.toEqual({ id: "usr-1" });
    expect(query.queryKey).toEqual(queryKeys.userProfile.detail());
  });

  it("configura a mutation de update com invalidacao do bootstrap", async () => {
    const command: UpdateUserProfileCommand = { stateUf: "SP" };
    mockUpdateProfile.mockResolvedValue({ id: "usr-1" });

    const mutation = useUpdateUserProfileMutation() as unknown as {
      mutationFn: (input: UpdateUserProfileCommand) => Promise<unknown>;
      onSuccess: () => Promise<void>;
    };

    await expect(mutation.mutationFn(command)).resolves.toEqual({ id: "usr-1" });
    await mutation.onSuccess();
    expect(mockUpdateProfile).toHaveBeenCalledWith(command);
    expect(mockInvalidateQueries).toHaveBeenNthCalledWith(1, {
      queryKey: queryKeys.userProfile.root,
    });
    expect(mockInvalidateQueries).toHaveBeenNthCalledWith(2, {
      queryKey: queryKeys.bootstrap.root,
    });
  });
});
