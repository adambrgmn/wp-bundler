import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';
import { Bundler } from './bundler';
import { Runner } from './runner';
import { Server } from './server';
import { Mode } from './types';

export async function cli() {
  let argv = await yargs(hideBin(process.argv))
    .command(
      'build',
      'Create production ready version of your project',
      {
        mode: {
          alias: 'm',
          default: 'prod',
          choices: ['dev', 'prod'] as const,
          description: 'Version of your source to output',
        },
        cwd: {
          description: 'Optional path to your project',
          type: 'string',
        },
      },
      (argv) => run(argv, 'prod'),
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
          default: 'dev',
          choices: ['dev', 'prod'] as const,
          description: 'Version of your source to output',
        },
        cwd: {
          description: 'Optional path to your project',
          type: 'string',
        },
      },
      (argv) => run(argv, 'dev', true),
    )
    .parse();

  if (argv._.length === 0) {
    console.warn(
      'Using wp-bundler without a sub command is deprecated and will be removed in the next major release.\n' +
        'Instead you can use `wp-bundler build` or `wp-bundler dev`.\n\n' +
        'See wp-bundler --help for more information.',
    );

    run(argv as any, argv.watch ? 'dev' : 'prod', false);
  }
}

type Args = {
  cwd?: string;
  mode?: string;
  port?: number;
  host?: string;
};

function run(argv: Args, defaultMode: Mode, watch = false) {
  let cwd = typeof argv.cwd === 'string' ? argv.cwd : process.cwd();
  let mode = ensureMode(argv.mode, defaultMode);
  let port = Number.isNaN(Number(argv.port)) ? 3000 : Number(argv.port);
  let host = typeof argv.host === 'string' ? argv.host : 'localhost';

  let bundler = new Bundler({ mode, cwd, host, port });
  let server = new Server({ port, host, cwd });
  let runner = new Runner({ bundler, server, cwd });

  if (watch) {
    runner.watch();
  } else {
    runner.build();
  }
}

function ensureMode(value: unknown, fallback: Mode): Mode {
  return typeof value === 'string' && ['dev', 'prod'].includes(value) ? (value as Mode) : fallback;
}
