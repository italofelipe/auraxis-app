import { Colors } from '@/constants/theme'
import { useColorScheme } from '@/hooks/use-color-scheme'
import { useThemeColor } from '@/hooks/use-theme-color'

jest.mock('@/hooks/use-color-scheme', () => ({
  useColorScheme: jest.fn(),
}))

const mockedUseColorScheme = jest.mocked(useColorScheme)

describe('useThemeColor', () => {
  beforeEach(() => {
    mockedUseColorScheme.mockReset()
  })

  it('prioriza a cor recebida por props para o tema atual', () => {
    mockedUseColorScheme.mockReturnValue('dark')

    const color = useThemeColor({ light: '#111111', dark: '#222222' }, 'text')

    expect(color).toBe('#222222')
  })

  it('usa a cor padrão do tema quando props não definem cor', () => {
    mockedUseColorScheme.mockReturnValue('light')

    const color = useThemeColor({}, 'background')

    expect(color).toBe(Colors.light.background)
  })

  it('fallback para tema light quando hook retorna null', () => {
    mockedUseColorScheme.mockReturnValue(null)

    const color = useThemeColor({}, 'icon')

    expect(color).toBe(Colors.light.icon)
  })
})
