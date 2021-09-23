import { BuildOptions } from 'esbuild';
import { BundlerPluginOptions } from './types';
import * as plugin from './plugins';
import { isNotNullable } from './utils/assert';

export function createBundlerOptions(
  options: BundlerPluginOptions,
): BuildOptions {
  return {
    entryPoints: options.config.entryPoints,
    outdir: options.project.paths.absolute(options.config.outdir),
    entryNames:
      options.mode === 'prod' ? '[dir]/[name].[hash]' : '[dir]/[name]',
    bundle: true,
    format: 'esm',
    platform: 'browser',
    target: 'es2020',
    sourcemap: options.config.sourcemap || options.mode === 'dev',
    plugins: [
      plugin.externals(options),
      plugin.manifest(options),
      plugin.define(options),
      plugin.postcss(options),
      options.mode === 'prod' ? plugin.nomodule(options) : null,
    ].filter(isNotNullable),
    absWorkingDir: options.project.paths.root,
    minify: options.mode === 'prod',
  };
}
