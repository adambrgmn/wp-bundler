import { Buffer } from 'node:buffer';
import * as process from 'node:process';

import esbuild, { BuildResult, Format, LogLevel, Metafile, OutputFile, Platform, Plugin } from 'esbuild';
import merge from 'lodash.merge';

import * as plugin from './plugins';
import { BundlerOptions, BundlerPluginOptions } from './types';
import { createAssetLoaderTemplate } from './utils/asset-loader';
import { rimraf } from './utils/rimraf';

export class Bundler {
  #options: BundlerOptions;

  #additionalOutput = new Set<OutputFile>();

  constructor(options: BundlerOptions) {
    this.#options = options;
  }

  prepare() {
    process.env.NODE_ENV = process.env.NODE_ENV || this.#options.mode === 'dev' ? 'development' : 'production';
    rimraf(this.#options.project.paths.absolute(this.#options.config.outdir));
  }

  async build() {
    let options = this.#createBundlerOptions('modern');
    let tasks = [esbuild.build(options)];

    if (this.#options.mode === 'prod') {
      let legacyOptions = this.#createBundlerOptions('legacy');
      tasks.push(esbuild.build(legacyOptions));
    }

    let results = await Promise.all(tasks);
    let result = results
      .slice(1)
      .reduce((acc, result) => merge(acc, omit(result, 'outputFiles')), omit(results[0], 'outputFiles'));

    ensureMetafile(result);
    this.#buildAssetLoader(result);

    let outputFiles = [...results.flatMap((res) => res.outputFiles), ...this.#additionalOutput].map((file) => ({
      ...file,
      path: this.#options.project.paths.relative(file.path),
    }));

    return { ...result, outputFiles } as const;
  }

  #buildAssetLoader(result: { metafile: Metafile }) {
    let pluginOptions = this.#createPluginOptions();
    let compileAssetLoader = createAssetLoaderTemplate(pluginOptions);
    let text = compileAssetLoader({ metafile: result.metafile });
    this.#additionalOutput.add({
      path: this.#options.project.paths.absolute(this.#options.config.assetLoader.path),
      contents: Buffer.from(text, 'utf-8'),
      text,
    });
  }

  #createBundlerOptions(variant: 'modern' | 'legacy' = 'modern') {
    let pluginOptions = this.#createPluginOptions();

    let entryNames = this.#options.mode === 'prod' ? '[dir]/[name].[hash]' : '[dir]/[name]';
    if (variant === 'legacy') {
      entryNames = `${entryNames}.nomodule`;
    }

    let plugins: Plugin[] = [
      plugin.reactFactory(pluginOptions),
      plugin.define(pluginOptions),
      plugin.externals(pluginOptions),
    ];

    if (variant === 'modern') {
      plugins.push(plugin.translations(pluginOptions), plugin.postcss(pluginOptions));
    } else {
      plugins.push(plugin.swc(pluginOptions), plugin.ignoreCss(pluginOptions));
    }

    return {
      entryPoints: this.#options.config.entryPoints,
      outdir: this.#options.project.paths.absolute(this.#options.config.outdir),
      entryNames,
      bundle: true,
      format: (variant === 'legacy' ? 'iife' : 'esm') as Format,
      platform: 'browser' as Platform,
      target: variant === 'legacy' ? 'es5' : 'es2020',
      write: false as const,
      metafile: true as const,

      loader: {
        '.ttf': 'file',
        '.eot': 'file',
        '.woff': 'file',
        '.woff2': 'file',
      } as const,

      sourcemap: this.#options.config.sourcemap || this.#options.mode === 'dev',
      minify: this.#options.mode === 'prod',

      absWorkingDir: this.#options.project.paths.root,
      logLevel: 'silent' as LogLevel,

      plugins,
    } as const;
  }

  #createPluginOptions(): BundlerPluginOptions {
    return {
      ...this.#options,
      output: this.#additionalOutput,
    };
  }
}

function omit<T, Key extends keyof T & string>(obj: T, ...keys: Key[]) {
  let clone = {} as T;
  let availableKeys = Object.keys(obj) as Key[];
  for (let key of availableKeys) {
    if (!keys.includes(key)) {
      clone[key] = obj[key];
    }
  }

  return clone as Omit<T, Key>;
}

function ensureMetafile<T extends BuildResult>(result: T): asserts result is T & { metafile: Metafile } {
  if (result.metafile == null) {
    throw new Error('No metafile emitted. Make sure that metafile is set to true in esbuild options.');
  }
}
