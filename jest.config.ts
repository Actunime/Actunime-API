/**
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

import type { Config } from 'jest';

const config: Config = {
  bail: false,
  clearMocks: true,
  globalSetup: '<rootDir>/test/globalSetup.ts',
  globalTeardown: '<rootDir>/test/globalTeardown.ts',
  transformIgnorePatterns: ['node_modules/(?!@actunime/utils)/'],
  transform: {
    '\\.(ts|js)$': 'babel-jest',
  },
  // roots: ['<rootDir>/test/'],
  roots: ['<rootDir>/test/'],
  setupFilesAfterEnv: ['<rootDir>/test/setup-test.ts'],
  testEnvironment: 'node',
};

export default config;
