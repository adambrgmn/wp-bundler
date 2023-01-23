import * as process from 'node:process';

import esbuild from 'esbuild';
import { hideBin } from 'yargs/helpers';
import yargs from 'yargs/yargs';

import * as plugin from './plugins/index.js';
import { createRunner } from './runner.js';
import { Mode } from './types.js';
import { dirname } from './utils/dirname.js';
import { getMetadata } from './utils/read-pkg.js';
import { rimraf } from './utils/rimraf.js';

const { __dirname } = dirname(import.meta.url);

export function cli() {
  return yargs(hideBin(process.argv))
    .command(
      'build',
      'Create production ready version of your project',
      {
        mode: {
          alias: 'm',
          default: 'prod' as Mode,
          choices: ['dev', 'prod'],
          description: 'Version of your source to output',
        } as const,
        cwd: {
          description: 'Optional path to your project',
          type: 'string',
        } as const,
      },
      (argv) => {
        let { project, bundler, config } = getMetadata(argv.cwd ?? process.cwd(), __dirname);
        let service = createRunner({
          mode: argv.mode,
          watch: false,
          config,
          project,
          bundler,
          host: 'localhost',
          port: 3000,
        });

        service.subscribe((state) => {
          if (state.matches('success')) process.exit(0);
          if (state.matches('error')) process.exit(1);
        });

        service.start();
      },
    )
    .command(
      'dev',
      'Run a development server',
      {
        host: {
          alias: 'h',
          default: 'localhost',
          description: 'Host to bind the dev server to',
        },
        port: {
          alias: 'p',
          default: 3000,
          description: 'Port to bind the dev server to',
        },
        mode: {
          alias: 'm',
          default: 'dev',
          choices: ['dev', 'prod'],
          description: 'Version of your source to output',
        } as const,
        cwd: {
          description: 'Optional path to your project',
          type: 'string',
        } as const,
      },
      async (argv) => {
        let metadata = getMetadata(argv.cwd ?? process.cwd(), __dirname);

        process.env.NODE_ENV = process.env.NODE_ENV || argv.mode === 'dev' ? 'development' : 'production';
        rimraf(metadata.project.paths.absolute(metadata.config.outdir));

        let context = await createContext(argv, metadata);

        try {
          await context.watch();
          await context.serve({
            servedir: metadata.project.paths.absolute(metadata.config.outdir),
            host: argv.host,
            port: argv.port,
          });
        } catch (error) {
          console.error(error);
        }
      },
    )
    .parse();
}

type Argv = {
  mode?: Mode;
  cwd?: string;
  host?: string;
  port?: number;
};

function createContext(argv: Argv, options: ReturnType<typeof getMetadata>) {
  let pluginOptions = {
    mode: 'prod' as const,
    cwd: process.cwd(),
    host: 'localhost',
    port: 3000,
    watch: argv.mode === 'dev',
    ...options,
    ...argv,
  };

  let plugins = [
    plugin.reactFactory(pluginOptions),
    plugin.define(pluginOptions),
    plugin.externals(pluginOptions),
    plugin.translations(pluginOptions),
    plugin.postcss(pluginOptions),
    plugin.assetLoader(pluginOptions),
  ];

  if (argv.mode === 'prod') {
    plugins.unshift(plugin.nomodule(pluginOptions));
  }

  plugins.push({
    name: 'test',
    setup(build) {
      build.onEnd(() => {
        console.log('build done');
      });
    },
  });

  let entryNames = argv.mode === 'prod' ? '[dir]/[name].[hash]' : '[dir]/[name]';

  return esbuild.context({
    entryPoints: options.config.entryPoints,
    outdir: options.project.paths.absolute(options.config.outdir),
    entryNames,
    bundle: true,
    format: 'esm',
    platform: 'browser',
    target: 'es2020',
    write: true,
    metafile: true,

    loader: {
      '.ttf': 'file',
      '.eot': 'file',
      '.woff': 'file',
      '.woff2': 'file',
    },

    sourcemap: options.config.sourcemap || argv.mode === 'dev',
    minify: argv.mode === 'prod',

    absWorkingDir: options.project.paths.root,
    logLevel: 'silent',

    plugins,
  });
}
