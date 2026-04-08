import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { Linking } from "react-native";

import { AppProviders } from "@/core/providers/app-providers";
import { PLANS_URL } from "@/shared/config/web-urls";

import { UpgradeCta } from "./upgrade-cta";

describe("UpgradeCta", () => {
  it("redireciona para a pagina de planos", async () => {
    const openUrlSpy = jest
      .spyOn(Linking, "openURL")
      .mockResolvedValueOnce({} as never);

    const { getByTestId, getByText } = render(
      <AppProviders>
        <UpgradeCta />
      </AppProviders>,
    );

    expect(getByText("Recurso Premium")).toBeTruthy();

    fireEvent.press(getByTestId("upgrade-cta-button"));

    await waitFor(() => {
      expect(openUrlSpy).toHaveBeenCalledWith(PLANS_URL);
    });

    openUrlSpy.mockRestore();
  });
});
