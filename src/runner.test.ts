/* eslint-disable jest/no-conditional-expect */
import * as path from 'node:path';

import { TestContext, TestFunction, expect, it } from 'vitest';
import { interpret } from 'xstate';

import { createContext, machine } from './runner.js';
import { TestLogger, TestWriter } from './test-utils/extensions.js';
import { BundlerOptions, Mode } from './types.js';
import { dirname } from './utils/dirname.js';
import { getMetadata } from './utils/read-pkg.js';

const { __dirname } = dirname(import.meta.url);

it.only(
  'generates the expected output',
  testService('theme', 'prod', (done, fail, service, writer, logger) => {
    if (service.getSnapshot().matches('error')) fail(new Error('Unexpectedly ended up in error state'));
    if (service.getSnapshot().matches('success')) {
      let output = logger.getOutput().replace(/\d+ ms/, 'XX ms');
      expect(output).toMatchInlineSnapshot(`
        "▶  WP-BUNDLER  Running bundler in prod mode.
        ▶  WP-BUNDLER  Building...

        main
          dist/main.NMV57XSA.js (1.32 kB)
          dist/main.TGLZWPB2.css (125 B)
          dist/main.nomodule.BAHQUTN7.js (1.51 kB)

        admin
          dist/admin.KRT7TWFX.js (108 B)
          dist/admin.nomodule.K3AVKCJ4.js (221 B)

        ✔  WP-BUNDLER  Build succeeded in XX ms.
        "
      `);

      expect(writer.getLastOutput()?.map((file) => file.path)).toMatchInlineSnapshot(`
        [
          "dist/main.NMV57XSA.js",
          "dist/main.TGLZWPB2.css",
          "dist/main.nomodule.BAHQUTN7.js",
          "dist/admin.KRT7TWFX.js",
          "dist/admin.nomodule.K3AVKCJ4.js",
          "languages/theme.pot",
          "languages/sv_SE.po",
          "languages/sv_SE.mo",
          "dist/languages/wp-bundler-theme-sv_SE-b3d4ea03d549de3b657a18b46bf56e02.json",
          "dist/AssetLoader.php",
        ]
      `);

      done();
    }
  }),
);

it(
  'goes into watch state in dev mode',
  testService('theme', 'dev', (done, fail, service, _, logger) => {
    if (service.getSnapshot().matches('error')) fail(new Error('Unexpectedly ended up in error state'));
    if (service.getSnapshot().matches('success')) done(); // fail(new Error('Unexpectedly ended up in success state'));

    if (service.getSnapshot().matches('watching')) {
      let output = logger.getOutput().replace(/\d+ ms/, 'XX ms');
      expect(output).toMatchInlineSnapshot(`
        "▶  WP-BUNDLER  Running bundler in dev mode.
        ▶  WP-BUNDLER  Building...

        main
          dist/main.js.map (17.18 kB)
          dist/main.js (3.03 kB)
          dist/main.css.map (377 B)
          dist/main.css (229 B)

        admin
          dist/admin.js.map (362 B)
          dist/admin.js (426 B)

        ✔  WP-BUNDLER  Build succeeded in XX ms.
        ▶  WP-BUNDLER  Watching files...
        "
      `);

      service.send('CANCEL');
    }
  }),
);

function testService(
  type: keyof typeof paths,
  mode: Mode,
  testFn: (done: () => void, fail: (reason: any) => void, ...args: ReturnType<typeof createService>) => any,
) {
  return wrap((_, done, fail) => {
    let [service, writer, logger] = createService(type, mode);
    service.onTransition(() => testFn(done, fail, service, writer, logger));
    service.start();
  });
}

function wrap(fn: (ctx: TestContext, done: () => void, fail: (reason: any) => void) => void) {
  let callback: TestFunction = (ctx) =>
    new Promise<void>((done, fail) => {
      fn(ctx, done, fail);
    });
  return callback;
}

const paths = {
  plugin: path.join(__dirname, '../examples/wp-bundler-plugin'),
  theme: path.join(__dirname, '../examples/wp-bundler-theme'),
} as const;

function createService(kind: keyof typeof paths, mode: Mode) {
  let meta = getMetadata(paths[kind], __dirname);
  let options: BundlerOptions = {
    mode,
    watch: false,
    host: 'localhost',
    port: 3000,
    ...meta,
  };

  let writer = new TestWriter(options);
  let logger = new TestLogger('WP-BUNDLER');

  let service = interpret(machine.withContext({ ...createContext(options), writer, logger }));

  return [service, writer, logger] as const;
}
