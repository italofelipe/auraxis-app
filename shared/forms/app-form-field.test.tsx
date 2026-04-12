import type { ReactElement } from "react";

import { render } from "@testing-library/react-native";
import { useForm } from "react-hook-form";

import { AppFormField } from "@/shared/forms/app-form-field";
import { TestProviders } from "@/shared/testing/test-providers";

interface SampleFormValues {
  readonly email: string;
}

const TestForm = (): ReactElement => {
  const form = useForm<SampleFormValues>({
    defaultValues: {
      email: "user@auraxis.com",
    },
  });

  return (
    <AppFormField
      control={form.control}
      name="email"
      label="Email"
      placeholder="Seu email"
    />
  );
};

describe("AppFormField", () => {
  it("renderiza label e placeholder do campo", () => {
    const { getByText, getByPlaceholderText } = render(
      <TestProviders>
        <TestForm />
      </TestProviders>,
    );

    expect(getByText("Email")).toBeTruthy();
    expect(getByPlaceholderText("Seu email")).toBeTruthy();
  });
});
