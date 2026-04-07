import { render } from "@testing-library/react-native";

import { useRootRouteGuard } from "@/core/navigation/use-route-guards";
import { TestProviders } from "@/shared/testing/test-providers";

import IndexScreen from "@/app/index";

const mockRedirect = jest.fn((_props: { href: string }) => null);

jest.mock("expo-router", () => ({
  Redirect: (props: { href: string }) => mockRedirect(props),
}));

jest.mock("@/core/navigation/use-route-guards", () => ({
  useRootRouteGuard: jest.fn(),
}));

const mockedUseRootRouteGuard = jest.mocked(useRootRouteGuard);

const mockRouteState = (state: {
  readonly ready: boolean;
  readonly redirectTo: string | null;
}): void => {
  mockedUseRootRouteGuard.mockReturnValue(state);
};

describe("IndexScreen", () => {
  afterEach(() => {
    mockedUseRootRouteGuard.mockReset();
    mockRedirect.mockClear();
  });

  it("renderiza o estado de carregamento enquanto a sessao hidrata", () => {
    mockRouteState({
      ready: false,
      redirectTo: null,
    });

    const { getByText } = render(
      <TestProviders>
        <IndexScreen />
      </TestProviders>,
    );

    expect(getByText("Carregando Auraxis")).toBeTruthy();
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it("redireciona para dashboard quando a sessao estiver autenticada", () => {
    mockRouteState({
      ready: true,
      redirectTo: "/dashboard",
    });

    render(
      <TestProviders>
        <IndexScreen />
      </TestProviders>,
    );

    expect(mockRedirect).toHaveBeenCalledWith({ href: "/dashboard" });
  });

  it("redireciona para login quando a sessao nao estiver autenticada", () => {
    mockRouteState({
      ready: true,
      redirectTo: "/login",
    });

    render(
      <TestProviders>
        <IndexScreen />
      </TestProviders>,
    );

    expect(mockRedirect).toHaveBeenCalledWith({ href: "/login" });
  });
});
