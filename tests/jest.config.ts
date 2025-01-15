/**
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */
import { createDefaultEsmPreset, type JestConfigWithTsJest } from 'ts-jest'
import type { Config } from 'jest'


const config: Config = {
  extensionsToTreatAsEsm: ['.ts'],
  clearMocks: true,
  coverageProvider: 'v8',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  testEnvironment: 'jsdom',
  testEnvironmentOptions: {
    resources: 'usable'
  },
  transform: {
    '^.+\\.jsx?$': 'babel-jest',
    '^.+\\.ts?$': 'ts-jest',
  },
  'transformIgnorePatterns': [
    // '(?!iframe-bridge).+\\.js$',
    // 'node_modules/(?!quick-lru)'
  ],
  verbose: true
}

const presetConfig = createDefaultEsmPreset({
  //...options
})

const jestConfig: JestConfigWithTsJest = {
  ...presetConfig,
  ...config
}

export default jestConfig
