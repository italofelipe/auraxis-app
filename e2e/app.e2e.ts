/**
 * Detox E2E — sanity test
 * Testa o fluxo básico de inicialização da app.
 *
 * Para rodar:
 *   npm run detox:build:ios
 *   npm run detox:test:ios
 */
import { device, expect as detoxExpect, element, by } from 'detox'

describe('App launch', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true })
  })

  afterAll(async () => {
    await device.terminateApp()
  })

  it('should show the home screen on launch', async () => {
    // Ajustar para o testID real da tela inicial
    await detoxExpect(element(by.id('home-screen'))).toBeVisible()
  })

  it('should navigate to login screen', async () => {
    // Ajustar para o testID real do botão de login
    await element(by.id('btn-login')).tap()
    await detoxExpect(element(by.id('login-screen'))).toBeVisible()
  })
})
