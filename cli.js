#!/usr/bin/env node
import meow from 'meow';
import * as path from 'path';
import { Bundler } from './dist/index.js';

const cli = meow(
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
  },
);

let watch = cli.flags.watch;
let mode = cli.flags.mode ?? watch ? 'dev' : 'prod';
let cwd = process.cwd();
if (cli.flags.cwd != null) {
  cwd = path.join(cwd, cli.flags.cwd);
}

process.env.NODE_ENV =
  process.env.NODE_ENV || mode === 'prod' ? 'production' : 'development';

let bundler = new Bundler({ mode, cwd });
bundler.on('init', () => console.log('init'));
bundler.on('rebuild', () => console.log('rebuild'));
bundler.on('end', () => console.log('end'));
bundler.on('error', () => console.log('error'));

if (watch) {
  bundler.watch();
} else {
  bundler.build();
}
