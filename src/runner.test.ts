/* eslint-disable jest/no-conditional-expect */
import * as path from 'node:path';

import { TestContext, TestFunction, expect, it } from 'vitest';
import { interpret } from 'xstate';

import { machine } from './runner';
import { TestLogger, TestWriter } from './test-utils/extensions';

it(
  'generates the expected output',
  wrap((_, done, reject) => {
    let [service, writer, logger] = createService('theme', 'prod');

    service.onTransition((state) => {
      if (state.matches('error')) reject(new Error('Ended up in unexpected error state'));
      if (state.matches('success')) {
        let output = logger.getOutput().replace(/\d+ ms/, '0 ms');
        expect(output).toMatchInlineSnapshot(`
          "▶  WP-BUNDLER  Running bundler in prod mode.
          ▶  WP-BUNDLER  Building...

          main
            dist/main.337537ZJ.js (1.32 kB)
            dist/main.TGLZWPB2.css (125 B)
            dist/main.GSPWX7R3.nomodule.js (1.85 kB)

          admin
            dist/admin.KRT7TWFX.js (108 B)
            dist/admin.BRZ25XL2.nomodule.js (172 B)

          ✔  WP-BUNDLER  Build succeeded in 0 ms.
          "
        `);

        expect(writer.getLastOutput()?.map((file) => file.path)).toMatchInlineSnapshot(`
          [
            "dist/main.337537ZJ.js",
            "dist/main.TGLZWPB2.css",
            "dist/admin.KRT7TWFX.js",
            "dist/main.GSPWX7R3.nomodule.js",
            "dist/admin.BRZ25XL2.nomodule.js",
            "languages/theme.pot",
            "languages/sv_SE.po",
            "languages/sv_SE.mo",
            "dist/languages/wp-bundler-theme-sv_SE-f7a614340d4c781c15358372503374f7.json",
            "dist/AssetLoader.php",
          ]
        `);

        done();
      }
    });

    service.start();
  }),
);

function wrap(fn: (ctx: TestContext, done: () => void, reject: (reason: any) => void) => void) {
  let callback: TestFunction = (ctx) =>
    new Promise<void>((done, reject) => {
      fn(ctx, done, reject);
    });
  return callback;
}

const paths = {
  plugin: path.join(__dirname, '../examples/wp-bundler-plugin'),
  theme: path.join(__dirname, '../examples/wp-bundler-theme'),
} as const;

function createService(type: keyof typeof paths, mode: string) {
  let writer = new TestWriter(paths[type]);
  let logger = new TestLogger('WP-BUNDLER');

  let service = interpret(
    machine.withContext({
      mode: 'prod',
      watch: false,
      cwd: paths[type],
      host: 'localhost',
      port: 3000,

      writer,
      logger,
      bundler: null as any,
      server: null as any,
      watcher: null as any,

      result: null,
      metafile: null,
      outputFiles: null,
      error: null,
      changedFiles: [],
      startTime: performance.now(),
    }),
  );

  return [service, writer, logger] as const;
}
