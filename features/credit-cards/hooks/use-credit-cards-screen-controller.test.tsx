import { act, renderHook } from "@testing-library/react-native";

import {
  useCreateCreditCardMutation,
  useDeleteCreditCardMutation,
  useUpdateCreditCardMutation,
} from "@/features/credit-cards/hooks/use-credit-cards-mutations";
import { useCreditCardsQuery } from "@/features/credit-cards/hooks/use-credit-cards-query";
import { useCreditCardsScreenController } from "@/features/credit-cards/hooks/use-credit-cards-screen-controller";

jest.mock("@/features/credit-cards/hooks/use-credit-cards-query", () => ({
  useCreditCardsQuery: jest.fn(),
}));
jest.mock("@/features/credit-cards/hooks/use-credit-cards-mutations", () => ({
  useCreateCreditCardMutation: jest.fn(),
  useUpdateCreditCardMutation: jest.fn(),
  useDeleteCreditCardMutation: jest.fn(),
}));

const mockedUseQuery = jest.mocked(useCreditCardsQuery);
const mockedUseCreate = jest.mocked(useCreateCreditCardMutation);
const mockedUseUpdate = jest.mocked(useUpdateCreditCardMutation);
const mockedUseDelete = jest.mocked(useDeleteCreditCardMutation);

const buildMutationStub = () => ({
  mutateAsync: jest.fn().mockResolvedValue(undefined),
  reset: jest.fn(),
  isPending: false,
  error: null,
});

const buildCard = (override: Record<string, unknown> = {}) => ({
  id: "c-1",
  name: "Cartao",
  brand: null,
  limitAmount: null,
  closingDay: null,
  dueDay: null,
  lastFourDigits: null,
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
  mockedUseQuery.mockReturnValue({ data: { creditCards: [] } } as never);
});

describe("useCreditCardsScreenController", () => {
  it("retorna lista vazia quando nao ha dados", () => {
    mockedUseQuery.mockReturnValue({ data: undefined } as never);
    const { result } = renderHook(() => useCreditCardsScreenController());
    expect(result.current.creditCards).toEqual([]);
  });

  it("create dispara createMutation e fecha o form", async () => {
    const { result } = renderHook(() => useCreditCardsScreenController());
    act(() => {
      result.current.handleOpenCreate();
    });
    await act(async () => {
      await result.current.handleSubmit({
        name: "X",
        brand: null,
        limitAmount: null,
        closingDay: null,
        dueDay: null,
        lastFourDigits: null,
      });
    });
    expect(createStub.mutateAsync).toHaveBeenCalled();
    expect(result.current.formMode.kind).toBe("closed");
  });

  it("edit dispara updateMutation com creditCardId", async () => {
    const { result } = renderHook(() => useCreditCardsScreenController());
    act(() => {
      result.current.handleOpenEdit(buildCard({ id: "c-9" }));
    });
    await act(async () => {
      await result.current.handleSubmit({
        name: "Editado",
        brand: null,
        limitAmount: null,
        closingDay: null,
        dueDay: null,
        lastFourDigits: null,
      });
    });
    expect(updateStub.mutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({ creditCardId: "c-9", name: "Editado" }),
    );
  });

  it("captura submitError quando create falha", async () => {
    createStub.mutateAsync.mockRejectedValueOnce(new Error("boom"));
    const { result } = renderHook(() => useCreditCardsScreenController());
    act(() => {
      result.current.handleOpenCreate();
    });
    await act(async () => {
      await result.current.handleSubmit({
        name: "X",
        brand: null,
        limitAmount: null,
        closingDay: null,
        dueDay: null,
        lastFourDigits: null,
      });
    });
    expect(result.current.submitError).toBeInstanceOf(Error);
  });

  it("delete dispara deleteMutation pelo id", async () => {
    const { result } = renderHook(() => useCreditCardsScreenController());
    await act(async () => {
      await result.current.handleDelete("c-1");
    });
    expect(deleteStub.mutateAsync).toHaveBeenCalledWith("c-1");
  });

  it("dismissSubmitError limpa estado", async () => {
    createStub.mutateAsync.mockRejectedValueOnce(new Error("oops"));
    const { result } = renderHook(() => useCreditCardsScreenController());
    act(() => {
      result.current.handleOpenCreate();
    });
    await act(async () => {
      await result.current.handleSubmit({
        name: "X",
        brand: null,
        limitAmount: null,
        closingDay: null,
        dueDay: null,
        lastFourDigits: null,
      });
    });
    act(() => {
      result.current.dismissSubmitError();
    });
    expect(result.current.submitError).toBeNull();
    expect(createStub.reset).toHaveBeenCalled();
  });
});
