import {
  useCreateTagMutation,
  useDeleteTagMutation,
  useUpdateTagMutation,
} from "@/features/tags/hooks/use-tags-mutations";
import { tagsService } from "@/features/tags/services/tags-service";

const mockCreateApiMutation = jest.fn();

jest.mock("@/core/query/create-api-mutation", () => ({
  createApiMutation: (...args: readonly unknown[]) => mockCreateApiMutation(...args),
}));

jest.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries: jest.fn() }),
}));

jest.mock("@/features/tags/services/tags-service", () => ({
  tagsService: {
    createTag: jest.fn(),
    updateTag: jest.fn(),
    deleteTag: jest.fn(),
  },
}));

const mockedService = tagsService as jest.Mocked<typeof tagsService>;

describe("tags mutations", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateApiMutation.mockImplementation((fn: unknown) => ({ fn }));
  });

  it("create encaminha command para tagsService.createTag", async () => {
    useCreateTagMutation();
    const [fn] = mockCreateApiMutation.mock.calls[0] ?? [];
    await (fn as (cmd: unknown) => Promise<unknown>)({ name: "X" });
    expect(mockedService.createTag).toHaveBeenCalledWith({ name: "X" });
  });

  it("update encaminha command para tagsService.updateTag", async () => {
    useUpdateTagMutation();
    const [fn] = mockCreateApiMutation.mock.calls[0] ?? [];
    await (fn as (cmd: unknown) => Promise<unknown>)({ tagId: "t1", name: "Y" });
    expect(mockedService.updateTag).toHaveBeenCalledWith({
      tagId: "t1",
      name: "Y",
    });
  });

  it("delete encaminha id para tagsService.deleteTag", async () => {
    useDeleteTagMutation();
    const [fn] = mockCreateApiMutation.mock.calls[0] ?? [];
    await (fn as (id: string) => Promise<unknown>)("t1");
    expect(mockedService.deleteTag).toHaveBeenCalledWith("t1");
  });
});
