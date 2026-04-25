import { renderHook } from "@testing-library/react-native";

import { useFormFocus } from "@/shared/forms/use-form-focus";

describe("useFormFocus", () => {
  it("returns stable refs for registered field names", () => {
    const { result } = renderHook(() => useFormFocus(["email", "password"]));

    const emailRef = result.current.getRef("email");
    const passwordRef = result.current.getRef("password");

    expect(emailRef).toBeDefined();
    expect(passwordRef).toBeDefined();
    expect(emailRef).not.toBe(passwordRef);
  });

  it("returns the same ref object on subsequent calls for the same field", () => {
    const { result } = renderHook(() => useFormFocus(["email", "password"]));

    const firstCall = result.current.getRef("email");
    const secondCall = result.current.getRef("email");

    expect(firstCall).toBe(secondCall);
  });

  it("focus does not throw when ref has no current element", () => {
    const { result } = renderHook(() => useFormFocus(["email"]));

    expect(() => {
      result.current.focus("email");
    }).not.toThrow();
  });

  it("focusNext does not throw when current field is the last one", () => {
    const { result } = renderHook(() => useFormFocus(["email", "password"]));

    expect(() => {
      result.current.focusNext("password");
    }).not.toThrow();
  });

  it("focusNext does not throw for unknown field names", () => {
    const { result } = renderHook(() => useFormFocus(["email", "password"]));

    expect(() => {
      result.current.focusNext("unknown-field");
    }).not.toThrow();
  });

  it("focusNext calls focus on the next field in order", () => {
    const { result } = renderHook(() => useFormFocus(["email", "password", "confirm"]));

    // Attach a mock TextInput ref
    const passwordRef = result.current.getRef("password");
    const mockFocus = jest.fn();
    (passwordRef as { current: unknown }).current = { focus: mockFocus } as unknown;

    result.current.focusNext("email");

    expect(mockFocus).toHaveBeenCalledTimes(1);
  });
});
