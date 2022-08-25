import * as process from 'node:process';

import { hideBin } from 'yargs/helpers';
import yargs from 'yargs/yargs';

import { createRunner } from './runner';
import { Mode } from './types';
import { getMetadata } from './utils/read-pkg';

export async function cli() {
  let argv = await yargs(hideBin(process.argv))
    .command(
      'build',
      'Create production ready version of your project',
      {
        mode: {
          alias: 'm',
          default: 'prod' as Mode,
          choices: ['dev', 'prod'],
          description: 'Version of your source to output',
        },
        cwd: {
          description: 'Optional path to your project',
          type: 'string',
        },
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
        },
        cwd: {
          description: 'Optional path to your project',
          type: 'string',
        },
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

  if (argv._.length === 0) {
    console.warn(
      'Using wp-bundler without a sub command is deprecated and will be removed in the next major release.\n' +
        'Instead you can use `wp-bundler build` or `wp-bundler dev`.\n\n' +
        'See wp-bundler --help for more information.',
    );

    let { project, bundler, config } = getMetadata((argv.cwd as string) ?? process.cwd(), __dirname);
    let service = createRunner({
      ...(argv as unknown as any),
      mode: argv.watch ? 'dev' : 'prod',
      watch: true,
      config,
      project,
      bundler,
    });

    service.subscribe((state) => {
      if (state.matches('success')) process.exit(0);
      if (state.matches('error')) process.exit(1);
    });

    service.start();
  }
}
