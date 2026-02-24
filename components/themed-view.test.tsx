import { render } from '@testing-library/react-native'

import { useThemeColor } from '@/hooks/use-theme-color'

import { ThemedView } from './themed-view'

jest.mock('@/hooks/use-theme-color', () => ({
  useThemeColor: jest.fn(),
}))

const mockedUseThemeColor = jest.mocked(useThemeColor)

describe('ThemedView', () => {
  beforeEach(() => {
    mockedUseThemeColor.mockReset()
    mockedUseThemeColor.mockReturnValue('#abcdef')
  })

  it('aplica background color retornado pelo hook', () => {
    const { getByTestId } = render(<ThemedView testID="themed-view" />)

    expect(getByTestId('themed-view')).toHaveStyle({ backgroundColor: '#abcdef' })
  })

  it('mescla estilo customizado com o estilo padrão', () => {
    const { getByTestId } = render(
      <ThemedView testID="themed-view" style={{ padding: 16 }} />,
    )

    expect(getByTestId('themed-view')).toHaveStyle({ backgroundColor: '#abcdef', padding: 16 })
  })
})
