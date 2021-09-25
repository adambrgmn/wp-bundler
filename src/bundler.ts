import EventEmitter from 'events';
import esbuild, { BuildOptions, BuildResult, Metafile, Message } from 'esbuild';
import _rimraf from 'rimraf';
import { promisify } from 'util';
import merge from 'lodash.merge';
import { BundlerPluginOptions, CliOptions, Mode, ProjectInfo } from './types';
import * as plugin from './plugins';
import { readPkg } from './utils/read-pkg';
import { dirname } from './utils/dirname';
import { BundlerConfigSchema, BundlerConfig } from './schema';

const rimraf = promisify(_rimraf);
const { __dirname } = dirname(import.meta.url);

interface BundlerEvents {
  'rebuild.init': void;
  'rebuild.end': BuildResult & { metafile: Metafile };
  'rebuild.error': { errors: Message[] };
}

export class Bundler extends EventEmitter {
  private mode: Mode;
  private cwd: string;
  private project: ProjectInfo = {} as unknown as any;
  private bundler: ProjectInfo = {} as unknown as any;
  private config: BundlerConfig = {} as unknown as any;
  private prepared = false;

  constructor({ mode, cwd }: CliOptions) {
    super();
    this.mode = mode;
    this.cwd = cwd;
  }

  async build() {
    let results = await Promise.all([
      esbuild.build(this.createBundlerOptions()),
      esbuild.build(this.createBundlerOptions({ nomodule: true })),
    ]);

    let result = results.reduce(
      (acc, next) => merge(acc, next),
      {} as BuildResult,
    );

    ensureMetafile(result);
    return result;
  }

  async watch() {
    let buildOptions = this.createBundlerOptions();
    buildOptions.watch = true;
    let result = await esbuild.build(buildOptions);
    ensureMetafile(result);
    return result;
  }

  async prepare() {
    if (this.prepared) return;
    this.bundler = await readPkg(__dirname);
    this.project = await readPkg(this.cwd);

    this.config = await BundlerConfigSchema.parseAsync(
      this.project.packageJson['wp-bundler'],
    );

    await rimraf(this.project.paths.absolute(this.config.outdir));
    this.prepared = true;
  }

  private createBundlerOptions({
    nomodule,
  }: { nomodule?: boolean } = {}): BuildOptions {
    let pluginOptions: BundlerPluginOptions = {
      mode: this.mode,
      config: this.config,
      project: this.project,
      bundler: this.bundler,
    };

    let options: BuildOptions = {
      entryPoints: this.config.entryPoints,
      outdir: this.project.paths.absolute(this.config.outdir),
      entryNames: this.mode === 'prod' ? '[dir]/[name].[hash]' : '[dir]/[name]',
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

      sourcemap: this.config.sourcemap || this.mode === 'dev',
      minify: this.mode === 'prod',

      absWorkingDir: this.project.paths.root,
      metafile: true,
      logLevel: 'silent',
      // publicPath: 'https://www.example.com/v1',

      plugins: [
        this.timingPlugin(),
        plugin.externals(pluginOptions),
        plugin.manifest(pluginOptions),
        plugin.define(pluginOptions),
        plugin.postcss(pluginOptions),
      ],
    };

    if (nomodule) {
      options.plugins!.push(plugin.babel(pluginOptions));
      options.entryNames = `${options.entryNames}.nomodule`;
      options.target = 'es5';
    }

    return options;
  }

  private timingPlugin(): esbuild.Plugin {
    return {
      name: 'wp-bundler-timing',
      setup: (build) => {
        build.onStart(() => {
          this.emit('rebuild.init', undefined);
        });

        build.onEnd((result) => {
          if (result.errors.length > 0) {
            this.emit('rebuild.error', result);
          } else {
            ensureMetafile(result);
            this.emit('rebuild.end', result);
          }
        });
      },
    };
  }

  emit<E extends keyof BundlerEvents>(eventName: E, payload: BundlerEvents[E]) {
    return super.emit(eventName, payload);
  }

  once<E extends keyof BundlerEvents>(
    eventName: E,
    listener: (payload: BundlerEvents[E]) => any,
  ) {
    return super.once(eventName, listener);
  }

  on<E extends keyof BundlerEvents>(
    eventName: E,
    listener: (payload: BundlerEvents[E]) => any,
  ) {
    return super.on(eventName, listener);
  }

  addListener<E extends keyof BundlerEvents>(
    eventName: E,
    listener: (payload: BundlerEvents[E]) => any,
  ) {
    return super.addListener(eventName, listener);
  }

  off<E extends keyof BundlerEvents>(
    eventName: E,
    listener: (payload: BundlerEvents[E]) => any,
  ) {
    return super.off(eventName, listener);
  }

  removeListener<E extends keyof BundlerEvents>(
    eventName: E,
    listener: (payload: BundlerEvents[E]) => any,
  ) {
    return super.removeListener(eventName, listener);
  }
}

function ensureMetafile(
  result: BuildResult,
): asserts result is BuildResult & { metafile: Metafile } {
  if (result.metafile == null) {
    throw new Error(
      'No metafile emitted. Make sure that metafile is set to true in esbuild options.',
    );
  }
}
