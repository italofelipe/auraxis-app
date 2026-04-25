import { act, renderHook } from "@testing-library/react-native";

import {
  useCreateReceivableMutation,
  useDeleteReceivableMutation,
  useMarkReceivableReceivedMutation,
} from "@/features/fiscal/hooks/use-fiscal-mutations";
import {
  useReceivablesQuery,
  useRevenueSummaryQuery,
} from "@/features/fiscal/hooks/use-fiscal-query";
import { useFiscalScreenController } from "@/features/fiscal/hooks/use-fiscal-screen-controller";

jest.mock("@/features/fiscal/hooks/use-fiscal-query", () => ({
  useReceivablesQuery: jest.fn(),
  useRevenueSummaryQuery: jest.fn(),
}));
jest.mock("@/features/fiscal/hooks/use-fiscal-mutations", () => ({
  useCreateReceivableMutation: jest.fn(),
  useMarkReceivableReceivedMutation: jest.fn(),
  useDeleteReceivableMutation: jest.fn(),
}));

const mockedUseList = jest.mocked(useReceivablesQuery);
const mockedUseSummary = jest.mocked(useRevenueSummaryQuery);
const mockedUseCreate = jest.mocked(useCreateReceivableMutation);
const mockedUseMark = jest.mocked(useMarkReceivableReceivedMutation);
const mockedUseDelete = jest.mocked(useDeleteReceivableMutation);

const buildStub = () => ({
  mutateAsync: jest.fn().mockResolvedValue(undefined),
  reset: jest.fn(),
  isPending: false,
});

let createStub: ReturnType<typeof buildStub>;
let markStub: ReturnType<typeof buildStub>;
let deleteStub: ReturnType<typeof buildStub>;

beforeEach(() => {
  createStub = buildStub();
  markStub = buildStub();
  deleteStub = buildStub();
  mockedUseCreate.mockReturnValue(createStub as never);
  mockedUseMark.mockReturnValue(markStub as never);
  mockedUseDelete.mockReturnValue(deleteStub as never);
  mockedUseList.mockReturnValue({ data: { receivables: [], count: 0 } } as never);
  mockedUseSummary.mockReturnValue({
    data: {
      expectedTotal: "0",
      receivedTotal: "0",
      pendingTotal: "0",
    },
  } as never);
});

describe("useFiscalScreenController", () => {
  it("inicia com formMode closed", () => {
    const { result } = renderHook(() => useFiscalScreenController());
    expect(result.current.formMode).toBe("closed");
  });

  it("handleOpenCreate alterna para create", () => {
    const { result } = renderHook(() => useFiscalScreenController());
    act(() => {
      result.current.handleOpenCreate();
    });
    expect(result.current.formMode).toBe("create");
  });

  it("handleSubmit normaliza amount e fecha o form", async () => {
    const { result } = renderHook(() => useFiscalScreenController());
    act(() => {
      result.current.handleOpenCreate();
    });
    await act(async () => {
      await result.current.handleSubmit({
        description: "NF 1",
        amount: "1500,75",
        expectedDate: "2026-05-01",
        category: null,
      });
    });
    expect(createStub.mutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({ amount: "1500.75" }),
    );
    expect(result.current.formMode).toBe("closed");
  });

  it("captura submitError quando create falha", async () => {
    createStub.mutateAsync.mockRejectedValueOnce(new Error("boom"));
    const { result } = renderHook(() => useFiscalScreenController());
    act(() => {
      result.current.handleOpenCreate();
    });
    await act(async () => {
      await result.current.handleSubmit({
        description: "X",
        amount: "1.00",
        expectedDate: "2026-05-01",
        category: null,
      });
    });
    expect(result.current.submitError).toBeInstanceOf(Error);
  });

  it("handleMarkReceived dispara markMutation com receivedDate hoje", async () => {
    const { result } = renderHook(() => useFiscalScreenController());
    await act(async () => {
      await result.current.handleMarkReceived("r-1");
    });
    expect(markStub.mutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        receivableId: "r-1",
        payload: expect.objectContaining({ receivedDate: expect.any(String) }),
      }),
    );
  });

  it("handleDelete dispara deleteMutation pelo id", async () => {
    const { result } = renderHook(() => useFiscalScreenController());
    await act(async () => {
      await result.current.handleDelete("r-1");
    });
    expect(deleteStub.mutateAsync).toHaveBeenCalledWith("r-1");
  });

  it("dismissSubmitError limpa estado", async () => {
    createStub.mutateAsync.mockRejectedValueOnce(new Error("oops"));
    const { result } = renderHook(() => useFiscalScreenController());
    act(() => {
      result.current.handleOpenCreate();
    });
    await act(async () => {
      await result.current.handleSubmit({
        description: "X",
        amount: "1.00",
        expectedDate: "2026-05-01",
        category: null,
      });
    });
    act(() => {
      result.current.dismissSubmitError();
    });
    expect(result.current.submitError).toBeNull();
  });
});
