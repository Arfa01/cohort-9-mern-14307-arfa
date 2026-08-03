module.exports = {
  clearMocks: true,
  testEnvironment: 'jsdom',   // simulates browser environment for testing the react components
  roots: ['<rootDir>/src'],
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  testMatch: ['**/*.test.ts', '**/*.test.tsx'],
  transform: {
    '^.+\\.[tj]sx?$': [
      'babel-jest',            // uses babel to transform tsx/tsx files to js for jest to run tests on them
      {
        presets: [
          ['@babel/preset-env', { targets: { node: 'current' } }],
          ['@babel/preset-react', { runtime: 'automatic' }],
          [
            '@babel/preset-typescript',
            { allExtensions: true, isTSX: true },
          ],
        ],
      },
    ],
  },
}
