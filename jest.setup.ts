/**
 * Jest Setup — auraxis-app
 * Executado após o framework Jest ser inicializado, antes de cada suite de testes.
 */

// Estende matchers do Jest com matchers específicos para React Native
// Ex: expect(element).toBeVisible(), expect(element).toHaveText('...')
import '@testing-library/jest-native/extend-expect'

// Mock global do expo-router (evita erros em testes unitários de componentes)
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    canGoBack: jest.fn(() => false),
  }),
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
  default: {
    expoConfig: {
      name: 'auraxis-app-test',
      slug: 'auraxis-app',
    },
  },
}))

// Silencia logs desnecessários durante testes
beforeAll(() => {
  const originalWarn = console.warn.bind(console)

  jest.spyOn(console, 'warn').mockImplementation((...args) => {
    const [msg] = args

    // Permite warnings de negócio, silencia apenas warnings de infra do RN
    if (typeof msg === 'string' && msg.includes('Warning: An update to')) return
    originalWarn(...args)
  })
})

afterAll(() => {
  jest.restoreAllMocks()
})
