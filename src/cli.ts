import * as process from 'node:process';

import { hideBin } from 'yargs/helpers';
import yargs from 'yargs/yargs';

import { createContext } from './context.js';
import { Mode } from './types.js';
import { dirname } from './utils/dirname.js';
import { Metadata, getMetadata } from './utils/read-pkg.js';
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
      async function build(argv) {
        let metadata = getMetadata(argv.cwd ?? process.cwd(), __dirname);
        prerun(argv.mode, metadata);

        let context = await createContext({ ...argv, ...metadata });

        try {
          await context.rebuild();
        } finally {
          await context.dispose();
        }
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
      async function dev(argv) {
        let metadata = getMetadata(argv.cwd ?? process.cwd(), __dirname);
        prerun(argv.mode, metadata);

        let context = await createContext({ ...argv, ...metadata });

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

function prerun(mode: Mode, metadata: Metadata) {
  process.env.NODE_ENV = process.env.NODE_ENV || mode === 'dev' ? 'development' : 'production';
  rimraf(metadata.project.paths.absolute(metadata.config.outdir));
}
