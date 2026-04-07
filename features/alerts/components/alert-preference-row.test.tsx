import { fireEvent, render } from "@testing-library/react-native";

import { AppProviders } from "@/core/providers/app-providers";
import type { AlertPreferenceRecord } from "@/features/alerts/contracts";

import { AlertPreferenceRow } from "./alert-preference-row";

const preference: AlertPreferenceRecord = {
  id: "pref-1",
  userId: "user-1",
  category: "payment_due",
  enabled: false,
  globalOptOut: true,
  updatedAt: "2026-04-07T10:00:00Z",
};

describe("AlertPreferenceRow", () => {
  it("propaga o toggle com o payload canônico", () => {
    const onToggle = jest.fn();

    const { getByTestId, getByText } = render(
      <AppProviders>
        <AlertPreferenceRow preference={preference} onToggle={onToggle} />
      </AppProviders>,
    );

    expect(getByText("payment_due")).toBeTruthy();
    expect(getByText("Canal principal: email")).toBeTruthy();

    fireEvent(
      getByTestId("alert-preference-pref-1-switch"),
      "onCheckedChange",
      true,
    );

    expect(onToggle).toHaveBeenCalledWith({
      category: "payment_due",
      enabled: true,
      globalOptOut: true,
    });
  });
});
