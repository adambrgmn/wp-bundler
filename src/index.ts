import * as path from 'path';
import { readPackageUpAsync } from 'read-pkg-up';
import * as esbuild from 'esbuild';
import { BundlerConfig, BundlerConfigSchema } from './schema';
import { externals } from './plugins';
import { manifest } from './plugins/manifest';
import { define } from './plugins/define';
import { CliOptions, Mode } from './types';

export async function main({
  mode = 'dev',
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

  const result = await esbuild.build(getSharedConfig(mode, config, paths));
  console.log(result);

  const server = await esbuild.serve(
    { port: config.port },
    getSharedConfig(mode, config, paths),
  );

  await server.wait;
}

function getSharedConfig(
  mode: Mode,
  config: BundlerConfig,
  { absolute, root }: ProjectPaths,
): esbuild.BuildOptions {
  return {
    entryPoints: config.entryPoints,
    outdir: absolute(config.outdir),
    bundle: true,
    format: 'iife',
    platform: 'browser',
    target: 'esnext',
    sourcemap: config.sourcemap,
    plugins: [externals(), manifest(), define(mode)],
    absWorkingDir: root,
    minify: mode === 'prod',
  };
}

interface ProjectPaths {
  root: string;
  absolute: (...to: string[]) => string;
}
