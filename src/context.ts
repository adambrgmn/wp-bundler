import * as process from 'node:process';

import esbuild from 'esbuild';

import { Logger } from './logger.js';
import * as plugin from './plugins/index.js';
import { Mode } from './types.js';
import { Metadata } from './utils/read-pkg.js';

type ContextOptions = Metadata & {
  watch?: boolean;
  write?: boolean;
  mode?: Mode;
  cwd?: string;
  host?: string;
  port?: number;
  logger: Logger;
};

export function createContext(options: ContextOptions) {
  let pluginOptions = {
    watch: false,
    mode: 'prod' as const,
    cwd: process.cwd(),
    host: 'localhost',
    port: 3000,
    ...options,
  };

  let plugins = [
    plugin.assetLoader(pluginOptions),
    plugin.define(pluginOptions),
    plugin.externals(pluginOptions),
    plugin.postcss(pluginOptions),
    plugin.reactFactory(pluginOptions),
    plugin.translations(pluginOptions),
    plugin.watch(pluginOptions),
    plugin.log(pluginOptions, options.logger),
  ];

  if (options.mode === 'prod') {
    plugins.unshift(plugin.nomodule(pluginOptions));
  }

  let entryNames = options.mode === 'prod' ? '[dir]/[name].[hash]' : '[dir]/[name]';

  return esbuild.context({
    entryPoints: options.config.entryPoints,
    outdir: options.project.paths.absolute(options.config.outdir),
    entryNames,
    bundle: true,
    format: 'esm',
    platform: 'browser',
    target: 'es2020',
    write: options.write ?? true,
    metafile: true,

    loader: {
      '.ttf': 'file',
      '.eot': 'file',
      '.woff': 'file',
      '.woff2': 'file',
    },

    sourcemap: options.config.sourcemap || options.mode === 'dev',
    minify: options.mode === 'prod',

    absWorkingDir: options.project.paths.root,
    logLevel: 'silent',

    plugins,
  });
}
