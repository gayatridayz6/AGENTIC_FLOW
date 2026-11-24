module.exports = {
  testEnvironment: 'jsdom',
  // Heal attempt 1: only crawl/collect tests from the live source tree so the
  // archived copies under workspace/ (and coverage/ output) are never picked up.
  roots: ['<rootDir>/src'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '<rootDir>/workspace/',
    '<rootDir>/coverage/',
  ],
  // Prevents jest-haste-map "naming collision: shopping-cart-feature" caused by
  // workspace/artifacts/dev/package.json duplicating the root package.json.
  modulePathIgnorePatterns: [
    '<rootDir>/workspace/',
    '<rootDir>/coverage/',
  ],
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/index.jsx',
    '!src/setupTests.js',
    '!src/reportWebVitals.js',
    '!src/__tests__/**',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};
