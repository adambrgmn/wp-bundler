import { Bundler } from './bundler';
import { Runner } from './runner';
import { CliArgsSchema } from './schema';
import { parseArgv } from './utils/parse-argv';
import pkg from '../package.json';

export async function cli(argv: typeof process.argv) {
  let args = parseArgv({
    argv,
    schema: CliArgsSchema,
    alias: { mode: 'm', watch: 'w', help: 'h', version: 'v' },
  });

  if (args.version) {
    console.log(pkg.version);
    return process.exit(0);
  }

  if (args.help) {
    console.log('Help');
    return process.exit(0);
  }

  const cwd = args.cwd ?? process.cwd();
  const watch = args.watch ?? false;
  const mode = args.mode ?? watch ? 'dev' : 'prod';
  let bundler = new Bundler({ mode, cwd });
  let runner = new Runner(bundler, cwd);

  if (watch) {
    await runner.watch();
  } else {
    await runner.build();
  }

  // let program: yargs.Argv<{ cwd?: string }> = yargs(hideBin(argv));

  // program.option('cwd', {
  //   type: 'string',
  //   description: 'Optional working directory',
  // });

  // program.command<GlobalArgs & { mode: 'dev' | 'prod' }>(
  //   'build',
  //   'Build project',
  //   (yargs) => {
  //     yargs.option('mode', {
  //       alias: 'm',
  //       choices: ['dev', 'prod'],
  //       default: 'prod',
  //       description: 'Mode to build project with',
  //     });
  //   },
  //   ({ mode, cwd = process.cwd() }) => {
  //     let bundler = new Bundler({ mode, cwd });
  //     let runner = new Runner(bundler, cwd);
  //     runner.build();
  //   },
  // );

  // program.command<GlobalArgs & { mode: 'dev' | 'prod' }>(
  //   'dev',
  //   'Run project in development mode',
  //   (yargs) => {
  //     yargs.option('mode', {
  //       alias: 'm',
  //       choices: ['dev', 'prod'],
  //       default: 'dev',
  //       description: 'Mode to build project with',
  //     });
  //   },
  //   ({ mode, cwd = process.cwd() }) => {
  //     let bundler = new Bundler({ mode, cwd });
  //     let runner = new Runner(bundler, cwd);
  //     runner.watch();
  //   },
  // );

  // return program.parse();
}
