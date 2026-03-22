import { render } from "@testing-library/react-native";

import type { Alert } from "@/types/contracts";

import { AlertItem } from "./alert-item";

const mockMarkReadMutate = jest.fn();
const mockDeleteAlertMutate = jest.fn();

jest.mock("@/hooks/mutations/use-mark-read-mutation", () => ({
  useMarkReadMutation: () => ({ mutate: mockMarkReadMutate }),
}));

jest.mock("@/hooks/mutations/use-delete-alert-mutation", () => ({
  useDeleteAlertMutation: () => ({ mutate: mockDeleteAlertMutate }),
}));

const baseAlert: Alert = {
  id: "alert-1",
  type: "system",
  title: "Test Alert",
  body: "Alert body text",
  severity: "info",
  read_at: null,
  created_at: "2026-03-18T00:00:00Z",
};

describe("AlertItem", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders severity dot with neutral color for info severity", () => {
    const { getByTestId } = render(<AlertItem alert={baseAlert} />);
    const dot = getByTestId("severity-dot-info");

    expect(dot).toBeTruthy();
    expect(dot.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ backgroundColor: "#413939" }),
      ]),
    );
  });

  it("renders severity dot with brand color for warning severity", () => {
    const warningAlert: Alert = { ...baseAlert, id: "alert-2", severity: "warning" };
    const { getByTestId } = render(<AlertItem alert={warningAlert} />);
    const dot = getByTestId("severity-dot-warning");

    expect(dot).toBeTruthy();
    expect(dot.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ backgroundColor: "#ffab1a" }),
      ]),
    );
  });

  it("renders severity dot with danger color for critical severity", () => {
    const criticalAlert: Alert = { ...baseAlert, id: "alert-3", severity: "critical" };
    const { getByTestId } = render(<AlertItem alert={criticalAlert} />);
    const dot = getByTestId("severity-dot-critical");

    expect(dot).toBeTruthy();
    expect(dot.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ backgroundColor: "#d64545" }),
      ]),
    );
  });
});
