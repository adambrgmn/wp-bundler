import pluginJs from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/** @type {import('eslint').Linter.FlatConfig[]} */
const config = [
  /**
   * For some unknown reason `ignores` needs to be in its own config object. As soon as I put any
   * other configuration together with `ignores` it stops working and eslint start lint files that
   * it shouldn't check.
   */
  { ignores: ['**/dist', '**/coverage', 'cli.js'] },
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      globals: globals.node,
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      'prefer-const': 'off',
      'no-empty': ['error', { allowEmptyCatch: true }],
      '@typescript-eslint/no-unused-vars': ['error', { ignoreRestSiblings: true }],
    },
  },
];

export default config;
