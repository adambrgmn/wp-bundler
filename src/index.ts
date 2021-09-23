import * as esbuild from 'esbuild';
import _rimraf from 'rimraf';
import { promisify } from 'util';
import { BundlerConfig, BundlerConfigSchema } from './schema';
import { externals, manifest, define } from './plugins';
import { CliOptions, Mode, ProjectPaths } from './types';
import { dirname } from './utils/dirname';
import { readPkg } from './utils/read-pkg';

const rimraf = promisify(_rimraf);
const { __dirname } = dirname(import.meta.url);

export async function main({
  mode = 'dev',
  cwd = process.cwd(),
}: CliOptions = {}) {
  const bundler = await readPkg(__dirname);
  const project = await readPkg(cwd);

  const config = await BundlerConfigSchema.parseAsync(
    project.packageJson['wp-bundler'],
  );

  await rimraf(project.paths.absolute(config.outdir));

  const buildOptions = getSharedConfig(mode, config, project.paths);
  await esbuild.build(buildOptions);
}

function getSharedConfig(
  mode: Mode,
  config: BundlerConfig,
  paths: ProjectPaths,
): esbuild.BuildOptions {
  return {
    entryPoints: config.entryPoints,
    outdir: paths.absolute(config.outdir),
    entryNames: mode === 'prod' ? '[dir]/[name].[hash]' : '[dir]/[name]',
    bundle: true,
    format: 'esm',
    platform: 'browser',
    target: 'es6',
    sourcemap: config.sourcemap || mode === 'dev',
    plugins: [
      externals(mode, config, paths),
      manifest(mode, config, paths),
      define(mode, config, paths),
    ],
    absWorkingDir: paths.root,
    minify: mode === 'prod',
  };
}
