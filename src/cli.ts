import * as process from 'node:process';

import { hideBin } from 'yargs/helpers';
import yargs from 'yargs/yargs';

import { createRunner } from './runner.js';
import { Mode } from './types.js';
import { dirname } from './utils/dirname.js';
import { getMetadata } from './utils/read-pkg.js';

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
          description: 'Host to bind the server to',
        },
        port: {
          alias: 'p',
          default: 3000,
          description: 'Port to bind the server to',
        },
        mode: {
          alias: 'm',
          default: 'dev' as Mode,
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
          watch: true,
          config,
          project,
          bundler,
          host: argv.host,
          port: argv.port,
        });

        service.subscribe((state) => {
          if (state.matches('success')) process.exit(0);
          if (state.matches('error')) process.exit(1);
        });

        service.start();
      },
    )
    .parse();
}
