/**
 * Mock estático do SDK do Sentry para isolar testes unitários do runtime nativo.
 */
export const init = jest.fn()
export const addBreadcrumb = jest.fn()
export const captureException = jest.fn()
export const setContext = jest.fn()
export const setTag = jest.fn()

const sentryMock = {
  init,
  addBreadcrumb,
  captureException,
  setContext,
  setTag,
}

export default sentryMock
