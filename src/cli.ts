import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { Bundler } from './bundler';
import { Runner } from './runner';

type GlobalArgs = { cwd?: string };

export function cli(argv: typeof process.argv) {
  let program: yargs.Argv<{ cwd?: string }> = yargs(hideBin(argv));

  program.option('cwd', {
    type: 'string',
    description: 'Optional working directory',
  });

  program.command<GlobalArgs & { mode: 'dev' | 'prod' }>(
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

  program.command<GlobalArgs & { mode: 'dev' | 'prod' }>(
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

  program.command<GlobalArgs>(
    'make-pot',
    'Extract translations from js source code',
    () => {},
    async ({ cwd = process.cwd() }) => {
      try {
        console.log('make-pot');
        process.exit(0);
      } catch (error) {
        console.error(error);
        process.exit(1);
      }
    },
  );

  program.command<GlobalArgs>(
    'make-json',
    'Extract translations from js source code',
    () => {},
    ({ cwd = process.cwd() }) => {
      try {
        console.log('make-json');
        process.exit(0);
      } catch (error) {
        console.error(error);
        process.exit(1);
      }
    },
  );

  return program.parse();
}
