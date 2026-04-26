import { act, renderHook } from "@testing-library/react-native";

import {
  useCreateTagMutation,
  useDeleteTagMutation,
  useUpdateTagMutation,
} from "@/features/tags/hooks/use-tags-mutations";
import { useTagsQuery } from "@/features/tags/hooks/use-tags-query";
import { useTagsScreenController } from "@/features/tags/hooks/use-tags-screen-controller";

jest.mock("@/features/tags/hooks/use-tags-query", () => ({
  useTagsQuery: jest.fn(),
}));
jest.mock("@/features/tags/hooks/use-tags-mutations", () => ({
  useCreateTagMutation: jest.fn(),
  useUpdateTagMutation: jest.fn(),
  useDeleteTagMutation: jest.fn(),
}));

const mockedUseQuery = jest.mocked(useTagsQuery);
const mockedUseCreate = jest.mocked(useCreateTagMutation);
const mockedUseUpdate = jest.mocked(useUpdateTagMutation);
const mockedUseDelete = jest.mocked(useDeleteTagMutation);

const buildMutationStub = () => ({
  mutateAsync: jest.fn().mockResolvedValue(undefined),
  reset: jest.fn(),
  isPending: false,
  error: null,
});

const buildTag = (override: Record<string, unknown> = {}) => ({
  id: "t-1",
  name: "Alimentacao",
  color: null,
  icon: null,
  ...override,
});

let createStub: ReturnType<typeof buildMutationStub>;
let updateStub: ReturnType<typeof buildMutationStub>;
let deleteStub: ReturnType<typeof buildMutationStub>;

beforeEach(() => {
  createStub = buildMutationStub();
  updateStub = buildMutationStub();
  deleteStub = buildMutationStub();
  mockedUseCreate.mockReturnValue(createStub as never);
  mockedUseUpdate.mockReturnValue(updateStub as never);
  mockedUseDelete.mockReturnValue(deleteStub as never);
  mockedUseQuery.mockReturnValue({ data: { tags: [] } } as never);
});

describe("useTagsScreenController", () => {
  it("retorna lista vazia quando nao ha dados", () => {
    mockedUseQuery.mockReturnValue({ data: undefined } as never);
    const { result } = renderHook(() => useTagsScreenController());
    expect(result.current.tags).toEqual([]);
  });

  it("create dispara createMutation e fecha o form", async () => {
    const { result } = renderHook(() => useTagsScreenController());
    act(() => {
      result.current.handleOpenCreate();
    });
    await act(async () => {
      await result.current.handleSubmit({
        name: "Casa",
        color: null,
        icon: null,
      });
    });
    expect(createStub.mutateAsync).toHaveBeenCalled();
    expect(result.current.formMode.kind).toBe("closed");
  });

  it("edit dispara updateMutation com tagId", async () => {
    const { result } = renderHook(() => useTagsScreenController());
    act(() => {
      result.current.handleOpenEdit(buildTag({ id: "t-9" }));
    });
    await act(async () => {
      await result.current.handleSubmit({
        name: "Editada",
        color: null,
        icon: null,
      });
    });
    expect(updateStub.mutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({ tagId: "t-9", name: "Editada" }),
    );
  });

  it("captura submitError quando create falha", async () => {
    createStub.mutateAsync.mockRejectedValueOnce(new Error("boom"));
    const { result } = renderHook(() => useTagsScreenController());
    act(() => {
      result.current.handleOpenCreate();
    });
    await act(async () => {
      await result.current.handleSubmit({
        name: "X",
        color: null,
        icon: null,
      });
    });
    expect(result.current.submitError).toBeInstanceOf(Error);
  });

  it("delete dispara deleteMutation pelo id", async () => {
    const { result } = renderHook(() => useTagsScreenController());
    await act(async () => {
      await result.current.handleDelete("t-1");
    });
    expect(deleteStub.mutateAsync).toHaveBeenCalledWith("t-1");
  });

  it("dismissSubmitError limpa estado", async () => {
    createStub.mutateAsync.mockRejectedValueOnce(new Error("oops"));
    const { result } = renderHook(() => useTagsScreenController());
    act(() => {
      result.current.handleOpenCreate();
    });
    await act(async () => {
      await result.current.handleSubmit({
        name: "X",
        color: null,
        icon: null,
      });
    });
    act(() => {
      result.current.dismissSubmitError();
    });
    expect(result.current.submitError).toBeNull();
    expect(createStub.reset).toHaveBeenCalled();
  });
});
