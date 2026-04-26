import { act, renderHook } from "@testing-library/react-native";

import {
  useCreateAccountMutation,
  useDeleteAccountMutation,
  useUpdateAccountMutation,
} from "@/features/accounts/hooks/use-accounts-mutations";
import { useAccountsQuery } from "@/features/accounts/hooks/use-accounts-query";
import { useAccountsScreenController } from "@/features/accounts/hooks/use-accounts-screen-controller";

jest.mock("@/features/accounts/hooks/use-accounts-query", () => ({
  useAccountsQuery: jest.fn(),
}));
jest.mock("@/features/accounts/hooks/use-accounts-mutations", () => ({
  useCreateAccountMutation: jest.fn(),
  useUpdateAccountMutation: jest.fn(),
  useDeleteAccountMutation: jest.fn(),
}));

const mockedUseQuery = jest.mocked(useAccountsQuery);
const mockedUseCreate = jest.mocked(useCreateAccountMutation);
const mockedUseUpdate = jest.mocked(useUpdateAccountMutation);
const mockedUseDelete = jest.mocked(useDeleteAccountMutation);

const buildMutationStub = () => ({
  mutateAsync: jest.fn().mockResolvedValue(undefined),
  reset: jest.fn(),
  isPending: false,
  error: null,
});

const buildAccount = (override: Record<string, unknown> = {}) => ({
  id: "a-1",
  name: "Conta",
  accountType: "checking" as const,
  institution: null,
  initialBalance: 0,
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
  mockedUseQuery.mockReturnValue({ data: { accounts: [] } } as never);
});

describe("useAccountsScreenController", () => {
  it("retorna lista vazia quando nao ha dados", () => {
    mockedUseQuery.mockReturnValue({ data: undefined } as never);
    const { result } = renderHook(() => useAccountsScreenController());
    expect(result.current.accounts).toEqual([]);
  });

  it("create dispara createMutation e fecha o form", async () => {
    const { result } = renderHook(() => useAccountsScreenController());
    act(() => {
      result.current.handleOpenCreate();
    });
    await act(async () => {
      await result.current.handleSubmit({
        name: "X",
        accountType: "checking",
        institution: null,
        initialBalance: 0,
      });
    });
    expect(createStub.mutateAsync).toHaveBeenCalled();
    expect(result.current.formMode.kind).toBe("closed");
  });

  it("edit dispara updateMutation com accountId", async () => {
    const { result } = renderHook(() => useAccountsScreenController());
    act(() => {
      result.current.handleOpenEdit(buildAccount({ id: "a-9" }));
    });
    await act(async () => {
      await result.current.handleSubmit({
        name: "Editada",
        accountType: "savings",
        institution: null,
        initialBalance: 100,
      });
    });
    expect(updateStub.mutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({ accountId: "a-9", name: "Editada" }),
    );
  });

  it("captura submitError quando create falha", async () => {
    createStub.mutateAsync.mockRejectedValueOnce(new Error("boom"));
    const { result } = renderHook(() => useAccountsScreenController());
    act(() => {
      result.current.handleOpenCreate();
    });
    await act(async () => {
      await result.current.handleSubmit({
        name: "X",
        accountType: "checking",
        institution: null,
        initialBalance: 0,
      });
    });
    expect(result.current.submitError).toBeInstanceOf(Error);
  });

  it("delete dispara deleteMutation pelo id", async () => {
    const { result } = renderHook(() => useAccountsScreenController());
    await act(async () => {
      await result.current.handleDelete("a-1");
    });
    expect(deleteStub.mutateAsync).toHaveBeenCalledWith("a-1");
  });

  it("dismissSubmitError limpa estado", async () => {
    createStub.mutateAsync.mockRejectedValueOnce(new Error("oops"));
    const { result } = renderHook(() => useAccountsScreenController());
    act(() => {
      result.current.handleOpenCreate();
    });
    await act(async () => {
      await result.current.handleSubmit({
        name: "X",
        accountType: "checking",
        institution: null,
        initialBalance: 0,
      });
    });
    act(() => {
      result.current.dismissSubmitError();
    });
    expect(result.current.submitError).toBeNull();
    expect(createStub.reset).toHaveBeenCalled();
  });
});
