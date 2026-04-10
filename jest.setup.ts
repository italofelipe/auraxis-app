/**
 * Jest Setup — auraxis-app
 * Executado após o framework Jest ser inicializado, antes de cada suite de testes.
 */

import { cleanup } from "@testing-library/react-native";

// Estende matchers do Jest com matchers específicos para React Native
// Ex: expect(element).toBeVisible(), expect(element).toHaveText('...')
import '@testing-library/jest-native/extend-expect'

const originalReadableStreamCancel = globalThis.ReadableStream?.prototype?.cancel

if (typeof originalReadableStreamCancel === "function") {
  globalThis.ReadableStream.prototype.cancel = function cancelWithExpoStreamGuard(
    reason?: unknown,
  ): Promise<void> {
    return Promise.resolve(
      originalReadableStreamCancel.call(this, reason) as Promise<void>,
    ).catch((error: unknown) => {
      if (
        error instanceof TypeError &&
        error.message === "Cannot cancel a stream that already has a reader"
      ) {
        return
      }

      return Promise.reject(error)
    })
  }
}

jest.mock("axios", () => require("axios/dist/node/axios.cjs"))

// Mock global do expo-router (evita erros em testes unitários de componentes)
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    canGoBack: jest.fn(() => false),
  }),
  usePathname: jest.fn(() => '/'),
  useLocalSearchParams: jest.fn(() => ({})),
  useSegments: jest.fn(() => []),
  Link: ({ children }: { children: React.ReactNode }) => children,
  Redirect: () => null,
  Stack: {
    Screen: () => null,
  },
  Tabs: {
    Screen: () => null,
  },
}))

// Mock do expo-constants
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    appOwnership: 'standalone',
    easConfig: {
      projectId: 'eas-project-id',
    },
    executionEnvironment: 'storeClient',
    expoConfig: {
      name: 'auraxis-app-test',
      slug: 'auraxis-app',
      version: '1.3.0',
      extra: {
        appEnv: 'test',
      },
    },
    nativeBuildVersion: '100',
  },
}))

const originalWarn = console.warn.bind(console)

beforeEach(() => {
  jest.spyOn(console, 'warn').mockImplementation((...args) => {
    const [msg] = args

    // Permite warnings de negócio, silencia apenas warnings de infra do RN
    if (typeof msg === 'string' && msg.includes('Warning: An update to')) return
    originalWarn(...args)
  })
})

afterEach(() => {
  cleanup()
  jest.useRealTimers()
  jest.clearAllMocks()
  jest.restoreAllMocks()
})
