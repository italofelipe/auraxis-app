import { act, renderHook } from "@testing-library/react-native";

import { useSalarySimulatorMutation } from "@/features/user-profile/hooks/use-salary-simulator-mutation";
import { useSalarySimulatorScreenController } from "@/features/user-profile/hooks/use-salary-simulator-screen-controller";

jest.mock("@/features/user-profile/hooks/use-salary-simulator-mutation", () => ({
  useSalarySimulatorMutation: jest.fn(),
}));

const mockedUseMutation = jest.mocked(useSalarySimulatorMutation);

const buildMutationStub = () => ({
  mutateAsync: jest.fn().mockResolvedValue({
    recomposition: 250.5,
    target: 5500,
  }),
  reset: jest.fn(),
  isPending: false,
  error: null,
});

let stub: ReturnType<typeof buildMutationStub>;

beforeEach(() => {
  stub = buildMutationStub();
  mockedUseMutation.mockReturnValue(stub as never);
});

const submitValid = {
  baseSalary: 5000,
  baseDate: "2024-01-01",
  discounts: 500,
  targetRealIncrease: 5,
};

describe("useSalarySimulatorScreenController", () => {
  it("estado inicial vazio", () => {
    const { result } = renderHook(() => useSalarySimulatorScreenController());
    expect(result.current.result).toBeNull();
    expect(result.current.submitError).toBeNull();
  });

  it("submit chama mutateAsync e armazena resultado", async () => {
    const { result } = renderHook(() => useSalarySimulatorScreenController());
    await act(async () => {
      await result.current.handleSubmit(submitValid);
    });
    expect(stub.mutateAsync).toHaveBeenCalledWith(submitValid);
    expect(result.current.result?.target).toBe(5500);
  });

  it("captura submitError quando mutation falha", async () => {
    stub.mutateAsync.mockRejectedValueOnce(new Error("boom"));
    const { result } = renderHook(() => useSalarySimulatorScreenController());
    await act(async () => {
      await result.current.handleSubmit(submitValid);
    });
    expect(result.current.submitError).toBeInstanceOf(Error);
  });

  it("handleReset limpa estado", async () => {
    const { result } = renderHook(() => useSalarySimulatorScreenController());
    await act(async () => {
      await result.current.handleSubmit(submitValid);
    });
    act(() => {
      result.current.handleReset();
    });
    expect(result.current.result).toBeNull();
    expect(stub.reset).toHaveBeenCalled();
  });

  it("dismissSubmitError limpa apenas o erro", async () => {
    stub.mutateAsync.mockRejectedValueOnce(new Error("oops"));
    const { result } = renderHook(() => useSalarySimulatorScreenController());
    await act(async () => {
      await result.current.handleSubmit(submitValid);
    });
    act(() => {
      result.current.dismissSubmitError();
    });
    expect(result.current.submitError).toBeNull();
  });
});
