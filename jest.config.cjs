module.exports = { testEnvironment: 'jsdom', transform: { '^.+\\.[jt]sx?$': 'babel-jest' }, setupFilesAfterEnv: ['<rootDir>/test/setupTests.js'], testMatch: ['<rootDir>/src/**/*.test.jsx'] };
