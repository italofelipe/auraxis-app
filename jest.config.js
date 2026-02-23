/** @type {import('jest').Config} */
const config = {
  // jest-expo lida com o preset correto por plataforma
  preset: 'jest-expo',

  // Padrões de arquivos de teste
  testMatch: [
    '**/__tests__/**/*.{ts,tsx}',
    '**/*.{spec,test}.{ts,tsx}',
  ],

  testPathIgnorePatterns: [
    '/node_modules/',
    '/e2e/',
    '/.expo/',
  ],

  // Transformações: jest-expo já configura babel-jest para RN
  transformIgnorePatterns: [
    'node_modules/(?!(' +
      '@react-native|react-native|react-native-.*|expo.*|@expo.*|' +
      '@unimodules.*|unimodules.*|sentry-expo|native-base|' +
      'react-clone-referenced-element|@react-navigation' +
    '))',
  ],

  // Módulos que o Node não consegue importar diretamente (assets, etc.)
  moduleNameMapper: {
    '\\.svg$': '<rootDir>/__mocks__/svgMock.ts',
    '\\.(png|jpg|jpeg|gif|webp)$': '<rootDir>/__mocks__/imageMock.ts',
    '^@/(.*)$': '<rootDir>/$1',
    '^~/(.*)$': '<rootDir>/$1',
  },

  // Setup files: configura @testing-library/jest-native matchers
  setupFilesAfterFramework: ['@testing-library/jest-native/extend-expect'],

  // Cobertura
  collectCoverageFrom: [
    'app/**/*.{ts,tsx}',
    'components/**/*.{ts,tsx}',
    'hooks/**/*.{ts,tsx}',
    'store/**/*.{ts,tsx}',
    'services/**/*.{ts,tsx}',
    'utils/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/*.config.{ts,js}',
    '!app/_layout.tsx',
  ],

  coverageThreshold: {
    global: {
      lines: 80,
      functions: 80,
      branches: 75,
      statements: 80,
    },
  },

  coverageReporters: ['text', 'json', 'lcov', 'html'],
  coverageDirectory: 'coverage',

  testTimeout: 10_000,
}

module.exports = config
