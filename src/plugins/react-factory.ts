import { BundlerPlugin } from '../types.js';

export const reactFactory: BundlerPlugin = ({ bundler }) => ({
  name: 'wp-bundler-react-factory',
  setup(build) {
    build.initialOptions.jsx = 'transform';
    build.initialOptions.jsxFactory = '__createElement__';
    build.initialOptions.jsxFragment = '__Fragment__';
    build.initialOptions.inject = [
      ...(build.initialOptions.inject || []),
      bundler.paths.absolute('./assets/wp-element/wp-element.ts'),
    ];
  },
});
