/**
 * Mock estático do SDK do Sentry para isolar testes unitários do runtime nativo.
 */
export const init = jest.fn()
export const addBreadcrumb = jest.fn()
export const captureException = jest.fn()

const sentryMock = {
  init,
  addBreadcrumb,
  captureException,
}

export default sentryMock
