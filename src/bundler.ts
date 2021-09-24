import EventEmitter from 'events';
import esbuild, {
  BuildFailure,
  BuildOptions,
  BuildResult,
  Metafile,
} from 'esbuild';
import _rimraf from 'rimraf';
import { promisify } from 'util';
import { BundlerPluginOptions, CliOptions, Mode, ProjectInfo } from './types';
import * as plugin from './plugins';
import { isNotNullable } from './utils/assert';
import { readPkg } from './utils/read-pkg';
import { dirname } from './utils/dirname';
import { BundlerConfigSchema, BundlerConfig } from './schema';

const rimraf = promisify(_rimraf);
const { __dirname } = dirname(import.meta.url);

interface BundlerEvents {
  init: Bundler;
  end: BuildResult & { metafile: Metafile };
  'rebuild-start': void;
  'rebuild-end': BuildResult & { metafile: Metafile };
  'rebuild-error': BuildFailure | BuildResult;
  rebuild: BuildResult & { metafile: Metafile };
  error: BuildFailure;
}

export class Bundler extends EventEmitter {
  private mode: Mode;
  private cwd: string;
  private awaitPrepare: Promise<void>;
  private project: ProjectInfo = {} as unknown as any;
  private bundler: ProjectInfo = {} as unknown as any;
  private config: BundlerConfig = {} as unknown as any;

  constructor({ mode, cwd }: CliOptions) {
    super();

    this.mode = mode;
    this.cwd = cwd;
    this.awaitPrepare = this.prepare();
  }

  async build() {
    await this.awaitPrepare;
    let buildOptions = this.createBundlerOptions();
    let result = await esbuild.build(buildOptions);

    ensureMetafile(result);
    return result;
  }

  async watch() {
    await this.awaitPrepare;
    let buildOptions = this.createBundlerOptions();

    buildOptions.watch = {
      onRebuild: (error, result) => {
        if (error != null) {
          this.emit('error', error);
        } else if (result != null) {
          ensureMetafile(result);
          this.emit('rebuild', result);
        }
      },
    };

    let result = await esbuild.build(buildOptions);
    return () => {
      ensureMetafile(result);
      this.emit('end', result);
      if (typeof result.stop === 'function') result.stop();
    };
  }

  private createBundlerOptions(): BuildOptions {
    let pluginOptions = {
      mode: this.mode,
      config: this.config,
      project: this.project,
      bundler: this.bundler,
    };

    return {
      entryPoints: this.config.entryPoints,
      outdir: this.project.paths.absolute(this.config.outdir),
      entryNames: this.mode === 'prod' ? '[dir]/[name].[hash]' : '[dir]/[name]',
      bundle: true,
      format: 'esm',
      platform: 'browser',
      target: 'es2020',

      sourcemap: this.config.sourcemap || this.mode === 'dev',
      minify: this.mode === 'prod',

      absWorkingDir: this.project.paths.root,
      metafile: true,
      logLevel: 'silent',

      plugins: [
        this.timingPlugin(),
        plugin.externals(pluginOptions),
        plugin.manifest(pluginOptions),
        plugin.define(pluginOptions),
        plugin.postcss(pluginOptions),
        this.mode === 'prod' ? plugin.nomodule(pluginOptions) : null,
      ].filter(isNotNullable),
    };
  }

  private timingPlugin(): esbuild.Plugin {
    return {
      name: 'wp-bundler-timing',
      setup: (build) => {
        build.onStart(() => {
          this.emit('rebuild-start', undefined);
        });

        build.onEnd((result) => {
          if (result.errors.length > 0) {
            this.emit('rebuild-error', result);
          } else {
            ensureMetafile(result);
            this.emit('rebuild-end', result);
          }
        });
      },
    };
  }

  private async prepare() {
    this.bundler = await readPkg(__dirname);
    this.project = await readPkg(this.cwd);

    this.config = await BundlerConfigSchema.parseAsync(
      this.project.packageJson['wp-bundler'],
    );

    await rimraf(this.project.paths.absolute(this.config.outdir));
    this.emit('init', this);
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
    metafile: true,
  };
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
