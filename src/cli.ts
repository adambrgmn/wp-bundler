import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { Bundler } from './bundler';
import { Runner } from './runner';
import { CliOptions } from './types';

export function cli(argv: typeof process.argv) {
  let program = yargs(hideBin(argv));

  program.command<CliOptions>(
    'build',
    'Build project',
    (yargs) => {
      yargs.option('mode', {
        alias: 'm',
        choices: ['dev', 'prod'],
        default: 'prod',
        description: 'Mode to build project with',
      });
    },
    ({ mode, cwd = process.cwd() }) => {
      let bundler = new Bundler({ mode, cwd });
      let runner = new Runner(bundler, cwd);
      runner.build();
    },
  );

  program.command<CliOptions>(
    'dev',
    'Run project in development mode',
    (yargs) => {
      yargs.option('mode', {
        alias: 'm',
        choices: ['dev', 'prod'],
        default: 'prod',
        description: 'Mode to build project with',
      });
    },
    ({ mode, cwd = process.cwd() }) => {
      let bundler = new Bundler({ mode, cwd });
      let runner = new Runner(bundler, cwd);
      runner.watch();
    },
  );

  program.option('cwd', {
    type: 'string',
    description: 'Optional working directory',
  });

  return program.parse();
}
