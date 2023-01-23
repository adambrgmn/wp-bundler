import { Buffer } from 'node:buffer';
import * as process from 'node:process';

import esbuild, { Format, LogLevel, Metafile, OutputFile, Platform, Plugin } from 'esbuild';

import * as plugin from './plugins/index.js';
import { BundlerOptions, BundlerPluginOptions, Mode } from './types.js';
import { createAssetLoaderTemplate } from './utils/asset-loader.js';
import { rimraf } from './utils/rimraf.js';

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
    let options = this.#createBundlerOptions(this.#options.mode);
    let result = await esbuild.build(options);
    this.#buildAssetLoader(result);

    let outputFiles = result.outputFiles.map((file) => ({
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

  #createBundlerOptions(mode: Mode) {
    let pluginOptions = this.#createPluginOptions();

    let entryNames = this.#options.mode === 'prod' ? '[dir]/[name].[hash]' : '[dir]/[name]';

    let plugins: Plugin[] = [
      plugin.reactFactory(pluginOptions),
      plugin.define(pluginOptions),
      plugin.externals(pluginOptions),
      plugin.translations(pluginOptions),
      plugin.postcss(pluginOptions),
    ];

    if (mode === 'prod') {
      plugins.unshift(plugin.nomodule(pluginOptions));
    }

    return {
      entryPoints: this.#options.config.entryPoints,
      outdir: this.#options.project.paths.absolute(this.#options.config.outdir),
      entryNames,
      bundle: true,
      format: 'esm' as Format,
      platform: 'browser' as Platform,
      target: 'es2020',
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
