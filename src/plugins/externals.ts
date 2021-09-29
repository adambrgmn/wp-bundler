import { PluginBuild } from 'esbuild';
import { toCamelCase } from 'strman';
import { BundlerPlugin } from '../types';
import { DEfAULT_EXTERNALS } from '../utils/externals';

export const externals: BundlerPlugin = ({ config, project }) => ({
  name: 'wp-bundler-externals',
  setup(build) {
    setupProjectExternals(build, config.externals);
    setupWpExternals(build);
    setupNodeExternals(project.packageJson.dependencies ?? {}, build);
  },
});

function setupProjectExternals(build: PluginBuild, providedExternals: Record<string, string> = {}) {
  let namespace = '_wp-bundler-externals';
  let externals: Record<string, string> = {
    ...DEfAULT_EXTERNALS,
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
      contents: `module.exports = window.wp.${toCamelCase(args.path.replace(/^@wordpress\//, ''))}`,
      loader: 'js',
    };
  });
}

function setupNodeExternals(dependecies: Record<string, string>, build: PluginBuild) {
  if (!Array.isArray(build.initialOptions.external)) {
    build.initialOptions.external = [];
  }

  for (let builtIn of nodeBuiltIns) {
    if (builtIn in dependecies) continue;
    build.initialOptions.external.push(builtIn);
  }
}

const nodeBuiltIns = [
  'assert',
  'buffer',
  'child_process',
  'cluster',
  'crypto',
  'dgram',
  'dns',
  'domain',
  'events',
  'fs',
  'http',
  'https',
  'net',
  'os',
  'path',
  'punycode',
  'querystring',
  'readline',
  'stream',
  'string_decoder',
  'timers',
  'tls',
  'tty',
  'url',
  'util',
  'v8',
  'vm',
  'zlib',
];
