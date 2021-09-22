import * as path from 'path';
import { readPackageUpAsync } from 'read-pkg-up';
import * as esbuild from 'esbuild';
import { BundlerConfig, BundlerConfigSchema } from './schema';
import { externals } from './plugins';
import { manifest } from './plugins/manifest';
import { define } from './plugins/define';
import { CliOptions, Mode } from './types';

export async function main({
  mode = 'prod',
  cwd = process.cwd(),
}: CliOptions = {}) {
  const project = await readPackageUpAsync({ cwd });
  if (project == null) {
    throw new Error(`Could not find a package.json relative to ${cwd}.`);
  }

  const root = path.dirname(project.path);
  const paths = { root, absolute: (...to: string[]) => path.join(root, ...to) };

  const config = await BundlerConfigSchema.parseAsync(
    project.packageJson['wp-bundler'],
  );

  await esbuild.build(getSharedConfig(mode, config, paths));

  const server = await esbuild.serve(
    { port: config.port },
    getSharedConfig(mode, config, paths),
  );

  await server.wait;
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
    target: 'esnext',
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

interface ProjectPaths {
  root: string;
  absolute: (...to: string[]) => string;
}
