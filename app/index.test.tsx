import { render } from "@testing-library/react-native";

import { AppProviders } from "@/components/providers/app-providers";
import { useSessionStore } from "@/stores/session-store";

import IndexScreen from "./index";

interface MockSessionState {
  readonly accessToken: string | null
  readonly userEmail: string | null
  readonly hydrated: boolean
  readonly isAuthenticated: boolean
  readonly bootstrapSession: () => Promise<void>
  readonly signIn: (accessToken: string, userEmail: string) => Promise<void>
  readonly signOut: () => Promise<void>
}

type SessionSelector<T> = (state: MockSessionState) => T;

const mockRedirect = jest.fn((_props: { href: string }) => null);

jest.mock("expo-router", () => ({
  Redirect: (props: { href: string }) => mockRedirect(props),
}));

jest.mock("@/stores/session-store", () => ({
  useSessionStore: jest.fn(),
}));

const mockedUseSessionStore = jest.mocked(useSessionStore);

const mockSessionState = (state: MockSessionState): void => {
  mockedUseSessionStore.mockImplementation(
    <T,>(selector: SessionSelector<T>): T => selector(state),
  );
};

describe("IndexScreen", () => {
  afterEach(() => {
    mockedUseSessionStore.mockReset();
    mockRedirect.mockClear();
  });

  it("renderiza o estado de carregamento enquanto a sessao hidrata", () => {
    mockSessionState({
      accessToken: null,
      userEmail: null,
      hydrated: false,
      isAuthenticated: false,
      bootstrapSession: async () => undefined,
      signIn: async () => undefined,
      signOut: async () => undefined,
    });

    const { getByText } = render(
      <AppProviders>
        <IndexScreen />
      </AppProviders>,
    );

    expect(getByText("Carregando Auraxis")).toBeTruthy();
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it("redireciona para dashboard quando a sessao estiver autenticada", () => {
    mockSessionState({
      accessToken: "token",
      userEmail: "user@auraxis.com.br",
      hydrated: true,
      isAuthenticated: true,
      bootstrapSession: async () => undefined,
      signIn: async () => undefined,
      signOut: async () => undefined,
    });

    render(<IndexScreen />);

    expect(mockRedirect).toHaveBeenCalledWith({ href: "/dashboard" });
  });

  it("redireciona para login quando a sessao nao estiver autenticada", () => {
    mockSessionState({
      accessToken: null,
      userEmail: null,
      hydrated: true,
      isAuthenticated: false,
      bootstrapSession: async () => undefined,
      signIn: async () => undefined,
      signOut: async () => undefined,
    });

    render(<IndexScreen />);

    expect(mockRedirect).toHaveBeenCalledWith({ href: "/login" });
  });
});
