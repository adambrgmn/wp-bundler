module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': require.resolve('./test/transformer.js'),
    '^.+\\.jsx?$': require.resolve('./test/transformer.js'),
  },
};
