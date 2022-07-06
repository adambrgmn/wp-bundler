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
          choices: ['dev', 'prod'],
          description: 'Version of your source to output',
        },
        cwd: {
          required: false,
          description: 'Optional path to your project',
          type: 'string',
        },
      },
      (argv) => {
        let cwd = argv.cwd ?? process.cwd();
        let mode = ensureMode(argv.mode, 'prod');
        let port = 3000;
        let host = 'localhost';

        let bundler = new Bundler({ mode, cwd, host, port });
        let server = new Server({ port, host, cwd });
        let runner = new Runner({ bundler, server, cwd });

        runner.build();
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
          default: 'dev',
          choices: ['dev', 'prod'],
          description: 'Version of your source to output',
        },
        cwd: {
          required: false,
          description: 'Optional path to your project',
          type: 'string',
        },
      },
      (argv) => {
        let cwd = argv.cwd ?? process.cwd();
        let mode = ensureMode(argv.mode, 'dev');
        let port = argv.port;
        let host = argv.host;

        let bundler = new Bundler({ mode, cwd, host, port });
        let server = new Server({ port, host, cwd });
        let runner = new Runner({ bundler, server, cwd });

        runner.watch();
      },
    )
    .parse();

  if (argv._.length === 0) {
    console.warn(
      'Using wp-bundler without a sub command is deprecated and will be removed in the next major release.\n' +
        'Instead you can use `wp-bundler build` or `wp-bundler dev`.\n\n' +
        'See wp-bundler --help for more information.',
    );

    let cwd = typeof argv.cwd === 'string' ? argv.cwd : process.cwd();
    let mode = ensureMode(argv.mode, argv.watch ? 'dev' : 'prod');
    let port = Number(argv.port) ?? 3000;
    let host = typeof argv.host === 'string' ? argv.host : 'localhost';

    let bundler = new Bundler({ mode, cwd, host, port });
    let server = new Server({ port, host, cwd });
    let runner = new Runner({ bundler, server, cwd });

    if (argv.watch) {
      runner.watch();
    } else {
      runner.build();
    }
  }
}

function ensureMode(value: unknown, fallback: Mode): Mode {
  return typeof value === 'string' && ['dev', 'prod'].includes(value) ? (value as Mode) : fallback;
}
