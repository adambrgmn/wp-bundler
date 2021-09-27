import meow from 'meow';
import * as path from 'path';
import { Bundler } from './bundler';
import { Runner } from './runner';
import { Mode } from './types';

export function cli() {
  const program = meow(
    `
  Usage
    $ wp-bundler
    $ wp-bundler --watch

  Options
    --watch, -w        Watch for file changes and rebuild assets on each change.
    --mode=[prod|dev]  Force dev or prod mode. Defaults to "prod", unless --watch is set, then "dev".
    --cwd=[string]     Optional working directory to use instead of default process.cwd().
`,
    {
      importMeta: import.meta,
      flags: {
        watch: { type: 'boolean', default: false, alias: 'w' },
        mode: { type: 'string' },
        cwd: { type: 'string' },
      },
      hardRejection: false,
    },
  );

  let watch = program.flags.watch;

  let mode = program.flags.mode ?? watch ? 'dev' : 'prod';

  let cwd = process.cwd();
  if (program.flags.cwd != null) {
    cwd = path.join(cwd, program.flags.cwd);
  }

  process.env.NODE_ENV =
    process.env.NODE_ENV || mode === 'prod' ? 'production' : 'development';

  let bundler = new Bundler({ mode: isMode(mode) ? mode : 'dev', cwd });
  let runner = new Runner(bundler, cwd);

  if (watch) {
    runner.watch();
  } else {
    runner.build();
  }
}

function isMode(m: string): m is Mode {
  return m === 'dev' || m === 'prod';
}
