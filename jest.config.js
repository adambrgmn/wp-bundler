/**
 * It is necessary to transpile these modules to ES5 for Jest to work properly.
 */
const transpile = [
  'execa',
  'strip-final-newline',
  'npm-run-path',
  'path-key',
  'onetime',
  'mimic-fn',
  'human-signals',
  'is-stream',
];

module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': require.resolve('./test/transformer.js'),
    '^.+\\.jsx?$': require.resolve('./test/transformer.js'),
  },
  transformIgnorePatterns: [`node_modules/(?!(${transpile.join('|')})/)`],
};
