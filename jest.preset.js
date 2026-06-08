const { workspaceLayout } = require('@nx/devkit');

module.exports = {
  testMatch: ['**/?(*.)+(spec|test).[jt]s?(x)'],
  transform: {
    '^.+\\.[tj]s$': ['@swc-node/jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageReporters: ['lcov', 'text-summary'],
  resolver: '@nx/jest/plugins/resolver',
};
