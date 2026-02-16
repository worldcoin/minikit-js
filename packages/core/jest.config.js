const config = {
  preset: 'ts-jest',
  moduleDirectories: ['node_modules', '<rootDir>/src'],
  modulePathIgnorePatterns: ['<rootDir>/deploy/cdk.out'],
  testMatch: ['**/*.test.ts'],
  testPathIgnorePatterns: ['node_modules'],
  collectCoverageFrom: ['**/*.(t|j)s'],
  reporters: ['default'],
};
export default config;
