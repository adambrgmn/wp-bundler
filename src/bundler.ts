import * as process from 'node:process';

import esbuild, { BuildOptions, BuildResult, Metafile, Plugin } from 'esbuild';
import merge from 'lodash.merge';

import * as plugin from './plugins';
import { BundlerConfig } from './schema';
import { BundlerPluginOptions, Mode, ProjectInfo } from './types';
import { createAssetLoaderTemplate } from './utils/asset-loader';
import { getMetadata } from './utils/read-pkg';
import { rimraf } from './utils/rimraf';

interface BundlerOptions {
  mode: Mode;
  cwd: string;
  host: string;
  port: number;
}

export class Bundler {
  #mode: Mode;
  #cwd: string;
  #host: string;
  #port: number;
  #project: ProjectInfo = {} as unknown as any;
  #bundler: ProjectInfo = {} as unknown as any;
  #config: BundlerConfig = {} as unknown as any;

  constructor({ mode, cwd, host, port }: BundlerOptions) {
    this.#mode = mode;
    this.#cwd = cwd;
    this.#host = host;
    this.#port = port;
  }

  async build() {
    let pluginOptions = this.#pluginOptions();
    let tasks: Promise<esbuild.BuildResult>[] = [];

    let options = this.#createBundlerOptions();
    options.plugins.push(plugin.translations(pluginOptions), plugin.postcss(pluginOptions));
    tasks.push(esbuild.build(options));

    if (this.#mode === 'prod') {
      let nomoduleOptions = this.#createBundlerOptions();
      nomoduleOptions.format = 'iife';
      nomoduleOptions.entryNames = `${nomoduleOptions.entryNames}.nomodule`;
      nomoduleOptions.target = 'es5';
      nomoduleOptions.plugins.push(plugin.swc(pluginOptions), plugin.ignoreCss(pluginOptions));

      tasks.push(esbuild.build(nomoduleOptions));
    }

    let results = await Promise.all(tasks);
    let result = results.slice(1).reduce<BuildResult>((acc, result) => merge(acc, result), results[0]);

    ensureMetafile(result);

    let writeTemplate = createAssetLoaderTemplate(pluginOptions);
    await writeTemplate({ metafile: result.metafile });

    return result;
  }

  prepare() {
    process.env.NODE_ENV = process.env.NODE_ENV || this.#mode === 'dev' ? 'development' : 'production';

    let { bundler, project, config } = getMetadata(this.#cwd, __dirname);

    this.#bundler = bundler;
    this.#project = project;
    this.#config = config;

    rimraf(this.#project.paths.absolute(this.#config.outdir));
  }

  #createBundlerOptions(): BuildOptions & { plugins: Plugin[] } {
    let pluginOptions = this.#pluginOptions();

    let options: BuildOptions & { plugins: Plugin[] } = {
      entryPoints: this.#config.entryPoints,
      outdir: this.#project.paths.absolute(this.#config.outdir),
      entryNames: this.#mode === 'prod' ? '[dir]/[name].[hash]' : '[dir]/[name]',
      bundle: true,
      format: 'esm',
      platform: 'browser',
      target: 'es2020',

      loader: {
        '.ttf': 'file',
        '.eot': 'file',
        '.woff': 'file',
        '.woff2': 'file',
      },

      sourcemap: this.#config.sourcemap || this.#mode === 'dev',
      minify: this.#mode === 'prod',

      absWorkingDir: this.#project.paths.root,
      metafile: true,
      logLevel: 'silent',
      // publicPath: 'https://www.example.com/v1',

      plugins: [plugin.define(pluginOptions), plugin.externals(pluginOptions)],
    };

    return options;
  }

  #pluginOptions(): BundlerPluginOptions {
    return {
      mode: this.#mode,
      config: this.#config,
      project: this.#project,
      bundler: this.#bundler,
      host: this.#host,
      port: this.#port,
    };
  }
}

function ensureMetafile(result: BuildResult): asserts result is BuildResult & { metafile: Metafile } {
  if (result.metafile == null) {
    throw new Error('No metafile emitted. Make sure that metafile is set to true in esbuild options.');
  }
}
