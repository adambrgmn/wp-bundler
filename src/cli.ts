import { Bundler } from './bundler';
import { Runner } from './runner';
import { Server } from './server';
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
    console.log('help');
    return process.exit(0);
  }

  const cwd = args.cwd ?? process.cwd();
  const watch = args.watch ?? false;
  const mode = args.mode ?? watch ? 'dev' : 'prod';
  const port = args.port ?? 3000;
  const host = args.host ?? 'localhost';

  let bundler = new Bundler({ mode, cwd });
  let server = new Server({ port, host, cwd });
  let runner = new Runner({ bundler, server, cwd });

  if (watch) {
    await runner.watch();
  } else {
    await runner.build();
  }
}
