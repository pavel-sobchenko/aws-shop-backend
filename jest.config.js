module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/*.test.ts', '**/*.test.js'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest'
  }
};
