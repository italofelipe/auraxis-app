import { render } from "@testing-library/react-native";

import { AppProviders } from "@/components/providers/app-providers";
import { useSessionStore } from "@/stores/session-store";

import IndexScreen from "@/app/index";

interface MockSessionState {
  readonly accessToken: string | null
  readonly refreshToken: string | null
  readonly user: {
    readonly id: string | null
    readonly name: string | null
    readonly email: string
    readonly emailConfirmed: boolean
  } | null
  readonly userEmail: string | null
  readonly hydrated: boolean
  readonly isAuthenticated: boolean
  readonly bootstrapSession: () => Promise<void>
  readonly signIn: (
    accessTokenOrSession: string | {
      readonly accessToken: string
      readonly refreshToken: string | null
      readonly user: {
        readonly id: string | null
        readonly name: string | null
        readonly email: string
        readonly emailConfirmed: boolean
      }
    },
    userEmail?: string,
  ) => Promise<void>
  readonly setSession: (session: unknown) => Promise<void>
  readonly updateUser: (user: unknown) => void
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
      refreshToken: null,
      user: null,
      userEmail: null,
      hydrated: false,
      isAuthenticated: false,
      bootstrapSession: async () => undefined,
      signIn: async () => undefined,
      setSession: async () => undefined,
      updateUser: () => undefined,
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
      refreshToken: null,
      user: {
        id: "user-id",
        name: "User",
        email: "user@auraxis.com.br",
        emailConfirmed: true,
      },
      userEmail: "user@auraxis.com.br",
      hydrated: true,
      isAuthenticated: true,
      bootstrapSession: async () => undefined,
      signIn: async () => undefined,
      setSession: async () => undefined,
      updateUser: () => undefined,
      signOut: async () => undefined,
    });

    render(<IndexScreen />);

    expect(mockRedirect).toHaveBeenCalledWith({ href: "/dashboard" });
  });

  it("redireciona para login quando a sessao nao estiver autenticada", () => {
    mockSessionState({
      accessToken: null,
      refreshToken: null,
      user: null,
      userEmail: null,
      hydrated: true,
      isAuthenticated: false,
      bootstrapSession: async () => undefined,
      signIn: async () => undefined,
      setSession: async () => undefined,
      updateUser: () => undefined,
      signOut: async () => undefined,
    });

    render(<IndexScreen />);

    expect(mockRedirect).toHaveBeenCalledWith({ href: "/login" });
  });
});
