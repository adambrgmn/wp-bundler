import { BuildOptions } from 'esbuild';
import { BundlerConfig } from './schema';
import { Mode, ProjectPaths } from './types';
import * as plugin from './plugins';
import { isNotNullable } from './utils/assert';

export function createBundlerOptions(
  mode: Mode,
  config: BundlerConfig,
  paths: ProjectPaths,
): BuildOptions {
  return {
    entryPoints: config.entryPoints,
    outdir: paths.absolute(config.outdir),
    entryNames: mode === 'prod' ? '[dir]/[name].[hash]' : '[dir]/[name]',
    bundle: true,
    format: 'esm',
    platform: 'browser',
    target: 'es2020',
    sourcemap: config.sourcemap || mode === 'dev',
    plugins: [
      plugin.externals(mode, config, paths),
      plugin.manifest(mode, config, paths),
      plugin.define(mode, config, paths),
      plugin.postcss(mode, config, paths),
      mode === 'prod' ? plugin.nomodule(mode, config, paths) : null,
    ].filter(isNotNullable),
    absWorkingDir: paths.root,
    minify: mode === 'prod',
  };
}
