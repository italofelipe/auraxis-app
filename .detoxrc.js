/** @type {Detox.DetoxConfig} */
/**
 * Detox E2E configuration — auraxis-app
 * Documentação: https://wix.github.io/Detox/docs/introduction/getting-started
 *
 * ⚠️  REQUISITOS para rodar Detox:
 *   - macOS com Xcode instalado (para iOS)
 *   - Android SDK configurado (para Android)
 *   - self-hosted GitHub Actions runner com macOS (para CI)
 *
 * Para instalar Detox localmente:
 *   npm install --save-dev detox @types/detox
 *   npx detox init
 *
 * Comandos disponíveis (adicionar ao package.json após instalação):
 *   "detox:build:ios":   "detox build --configuration ios.sim.debug"
 *   "detox:test:ios":    "detox test --configuration ios.sim.debug"
 *   "detox:build:android": "detox build --configuration android.emu.debug"
 *   "detox:test:android":  "detox test --configuration android.emu.debug"
 */

module.exports = {
  testRunner: {
    args: {
      $0: 'jest',
      config: 'e2e/jest.config.js',
    },
    jest: {
      setupTimeout: 120000,
    },
  },

  apps: {
    'ios.debug': {
      type: 'ios.app',
      binaryPath: 'ios/build/Build/Products/Debug-iphonesimulator/auraxisapp.app',
      build:
        'xcodebuild -workspace ios/auraxisapp.xcworkspace -scheme auraxisapp -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build',
    },
    'android.debug': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/debug/app-debug.apk',
      build:
        'cd android && ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug',
      reversePorts: [8081],
    },
  },

  devices: {
    simulator: {
      type: 'ios.simulator',
      device: {
        type: 'iPhone 16',
      },
    },
    emulator: {
      type: 'android.emulator',
      device: {
        avdName: 'Pixel_7_API_35',
      },
    },
  },

  configurations: {
    'ios.sim.debug': {
      device: 'simulator',
      app: 'ios.debug',
    },
    'android.emu.debug': {
      device: 'emulator',
      app: 'android.debug',
    },
  },
}
