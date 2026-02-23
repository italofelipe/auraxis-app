/**
 * Mock para arquivos SVG importados como componentes React Native.
 * Evita erros de parsing em testes Jest.
 */
import React from 'react'
import { View } from 'react-native'

const SvgMock = () => React.createElement(View, { testID: 'svg-mock' })
SvgMock.displayName = 'SvgMock'

export default SvgMock
export { SvgMock as ReactComponent }
