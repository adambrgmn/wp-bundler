import { PluginBuild } from 'esbuild';
import { toCamelCase } from 'strman';
import { BundlerPlugin } from '../types';

export const externals: BundlerPlugin = (_, config) => ({
  name: 'wp-bundler-externals',
  setup(build) {
    setupProjectExternals(build, config.externals);
    setupWpExternals(build);
  },
});

function setupProjectExternals(
  build: PluginBuild,
  providedExternals: Record<string, string> = {},
) {
  let namespace = '_wp-bundler-externals';
  let externals: Record<string, string> = {
    react: 'React',
    'react-dom': 'ReactDOM',
    jquery: '$',
    ...providedExternals,
  };

  for (let key of Object.keys(externals)) {
    build.onResolve({ filter: new RegExp(`^${key}$`) }, (args) => {
      return { path: args.path, namespace };
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
  build.onResolve({ filter: /@wordpress\/.+/ }, (args) => {
    return { path: args.path, namespace };
  });

  build.onLoad({ filter: /.*/, namespace }, (args) => {
    return {
      contents: `module.exports = window.wp.${toCamelCase(
        args.path.replace(/^@wordpress\//, ''),
      )}`,
      loader: 'js',
    };
  });
}
