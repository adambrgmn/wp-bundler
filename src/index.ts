import * as esbuild from 'esbuild';
import _rimraf from 'rimraf';
import { promisify } from 'util';
import { BundlerConfigSchema } from './schema';
import { CliOptions } from './types';
import { dirname } from './utils/dirname';
import { readPkg } from './utils/read-pkg';
import { createBundlerOptions } from './create-bundler';

const rimraf = promisify(_rimraf);
const { __dirname } = dirname(import.meta.url);

export async function build({
  mode = 'dev',
  cwd = process.cwd(),
}: CliOptions = {}) {
  const bundler = await readPkg(__dirname);
  const project = await readPkg(cwd);

  const config = await BundlerConfigSchema.parseAsync(
    project.packageJson['wp-bundler'],
  );

  await rimraf(project.paths.absolute(config.outdir));

  const buildOptions = createBundlerOptions({ mode, config, project, bundler });
  await esbuild.build(buildOptions);
}
