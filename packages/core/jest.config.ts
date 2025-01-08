import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  moduleDirectories: ['node_modules', '<rootDir>'],
  modulePathIgnorePatterns: ['<rootDir>/deploy/cdk.out'],
  testMatch: ['**/*.test.ts'],
  testPathIgnorePatterns: ['node_modules'],
  collectCoverageFrom: ['**/*.(t|j)s'],
  reporters: ['default'],
};

export default config;
