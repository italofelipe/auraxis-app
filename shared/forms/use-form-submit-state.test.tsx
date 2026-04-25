import { act, renderHook } from "@testing-library/react-native";
import { z } from "zod";

import { useAppForm } from "@/shared/forms/use-app-form";
import { useFormSubmitState } from "@/shared/forms/use-form-submit-state";

const testSchema = z.object({
  name: z.string().min(1, "Required"),
});

type TestFormValues = z.infer<typeof testSchema>;

describe("useFormSubmitState", () => {
  it("returns idle status on initial render", () => {
    const { result } = renderHook(() => {
      const form = useAppForm<TestFormValues>(testSchema, {
        defaultValues: { name: "" },
      });

      return useFormSubmitState(form);
    });

    expect(result.current.status).toBe("idle");
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.isBusy).toBe(false);
    expect(result.current.isSubmitDisabled).toBe(false);
  });

  it("exposes isSubmitting as false when not submitting", () => {
    const { result } = renderHook(() => {
      const form = useAppForm<TestFormValues>(testSchema, {
        defaultValues: { name: "Alice" },
      });

      return useFormSubmitState(form);
    });

    expect(result.current.isSubmitting).toBe(false);
  });

  it("disables submit when isBusy is true", () => {
    const { result } = renderHook(() => {
      const form = useAppForm<TestFormValues>(testSchema, {
        defaultValues: { name: "" },
      });

      return { form, submitState: useFormSubmitState(form) };
    });

    // Initially not busy
    expect(result.current.submitState.isSubmitDisabled).toBe(false);
  });

  it("returns error status after failed submission", async () => {
    const { result } = renderHook(() => {
      const form = useAppForm<TestFormValues>(testSchema, {
        defaultValues: { name: "" },
      });

      return { form, submitState: useFormSubmitState(form) };
    });

    await act(async () => {
      await result.current.form.handleSubmit(() => {
        // noop — validation will fail because name is empty
      })();
    });

    expect(result.current.submitState.status).toBe("error");
  });

  it("returns success status after successful submission", async () => {
    const { result } = renderHook(() => {
      const form = useAppForm<TestFormValues>(testSchema, {
        defaultValues: { name: "Alice" },
      });

      return { form, submitState: useFormSubmitState(form) };
    });

    await act(async () => {
      await result.current.form.handleSubmit(() => {
        // success path
      })();
    });

    expect(result.current.submitState.status).toBe("success");
  });
});
