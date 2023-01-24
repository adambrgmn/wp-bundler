import type { PluginBuild } from 'esbuild';
import { toCamelCase } from 'strman';

import type { BundlerPlugin } from '../types.js';
import { DEFAULT_EXTERNALS } from '../utils/externals.js';

export const externals: BundlerPlugin = ({ config }) => ({
  name: 'wp-bundler-externals',
  setup(build) {
    setupProjectExternals(build, config.externals);
    setupWpExternals(build);
  },
});

function setupProjectExternals(build: PluginBuild, providedExternals: Record<string, string> = {}) {
  let namespace = '_wp-bundler-externals';
  let externals: Record<string, string> = {
    ...DEFAULT_EXTERNALS,
    ...providedExternals,
  };

  for (let key of Object.keys(externals)) {
    build.onResolve({ filter: new RegExp(`^${key}$`) }, (args) => {
      return { path: args.path, namespace, sideEffects: false };
    });
  }

  build.onLoad({ filter: /.*/, namespace }, (args) => {
    return {
      contents: `module.exports = window.${externals[args.path]}`,
      loader: 'js',
    };
  });
}

function setupWpExternals(build: PluginBuild) {
  let namespace = '_wp-bundler-wp-externals';

  /**
   * The following packages are treated as internal packages by Gutenberg. If used the content should
   * be bundled with the projects source files instead of read from `window.wp`.
   */
  let internal = ['@wordpress/icons'];

  build.onResolve({ filter: /@wordpress\/.+/ }, (args) => {
    if (internal.includes(args.path)) return undefined;
    return { path: args.path, namespace, sideEffects: false };
  });

  build.onLoad({ filter: /.*/, namespace }, (args) => {
    return {
      contents: `module.exports = window.wp.${toCamelCase(args.path.replace(/^@wordpress\//, ''))}`,
      loader: 'js',
    };
  });
}
