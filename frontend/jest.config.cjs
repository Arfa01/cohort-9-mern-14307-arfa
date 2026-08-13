module.exports = {
  clearMocks: true,
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/main.tsx',
    '!src/test/**',
  ],
  coverageDirectory: '<rootDir>/coverage',
  coverageProvider: 'babel',
  coverageReporters: [
    'text',
    ['lcov', { projectRoot: '..' }],
  ],
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  testMatch: ['**/*.test.ts', '**/*.test.tsx'],
  transform: {
    '^.+\\.[tj]sx?$': [
      'babel-jest',
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
