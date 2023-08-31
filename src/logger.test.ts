import { Writable } from 'node:stream';

import { Chalk } from 'chalk';
import { describe, expect, it } from 'vitest';

import { Logger } from './logger.js';

const chalk = new Chalk({ level: 0 });

describe('Logger', () => {
  it('should log depending on level', () => {
    const writer = new TestWriter();
    let logger = new Logger('prefix', writer, chalk);

    logger.info('info');
    logger.success('success');
    logger.warn('warn');
    logger.error('error');
    logger.raw('raw');

    expect(writer.output()).toMatchInlineSnapshot(`
      "▶  prefix  info
      ✔  prefix  success
      ▲  WARNING  warn
      ✖  ERROR  error
      raw
      "
    `);
  });

  it('can format esbuild messages', () => {
    const writer = new TestWriter();
    let logger = new Logger('prefix', writer, chalk);

    logger.buildResult({
      errors: [
        {
          id: '1',
          pluginName: 'test',
          detail: {} as any,
          text: 'something went wrong',
          location: {
            file: 'test.ts',
            line: 1,
            column: 3,
            lineText: 'console.log("hello world");',
            namespace: 'file',
            length: 20,
            suggestion: 'Write a better message',
          },
          notes: [
            { text: 'A note', location: {} as any },
            { text: 'The plugin "something" failed to load (this note should be ignored)', location: {} as any },
          ],
        },
      ],
      warnings: [
        {
          id: '2',
          pluginName: 'test',
          detail: {} as any,
          text: 'you have been warned',
          location: {
            file: 'warn.ts',
            line: 1,
            column: 3,
            lineText: 'with {',
            namespace: 'file',
            length: 20,
            suggestion: 'Do not use `with`',
          },
          notes: [],
        },
      ],
    });

    expect(writer.output()).toMatchInlineSnapshot(`
      "▲  WARNING  you have been warned

          warn.ts:1:3:
            1 │ with {

      ✖  ERROR  something went wrong

          test.ts:1:3:
            1 │ console.log(\\"hello world\\");

          A note

      "
    `);
  });

  it('can format bundle output', () => {
    const writer = new TestWriter();
    let logger = new Logger('prefix', writer, chalk);

    function output(path: string, text: string) {
      const encoder = new TextEncoder();
      return { path, contents: encoder.encode(text), text, hash: '' };
    }

    logger.buildOutput({
      root: '/',
      metafile: {
        inputs: {},
        outputs: {
          'dist/entry.js': { bytes: 100, inputs: {}, imports: [], exports: [], entryPoint: 'src/entry.ts' },
          'dist/entry.css': { bytes: 100, inputs: {}, imports: [], exports: [], entryPoint: 'src/entry.ts' },
          'dist/AssetLoader.php': { bytes: 100, inputs: {}, imports: [], exports: [] },
        },
      },
      entryPoints: {
        entry: 'src/entry.ts',
      },
      outputFiles: [
        output('dist/entry.js', 'console.log("hello world");\n'),
        output('dist/entry.css', '.button { color: rebeccapurple; }\n'),
        output('dist/AssetLoader.php', '<?php\n'),
      ],
    });

    expect(writer.output()).toMatchInlineSnapshot(`
      "
      entry
        dist/entry.js (28 B)
        dist/entry.css (34 B)

      asset-loader
        dist/AssetLoader.php (6 B)

      "
    `);
  });
});

class TestWriter extends Writable {
  #lines: string[] = [];

  write(chunk: any, callback?: ((error: Error | null | undefined) => void) | undefined): boolean;
  write(
    chunk: any,
    encoding: BufferEncoding,
    callback?: ((error: Error | null | undefined) => void) | undefined,
  ): boolean;
  write(chunk: unknown, encoding?: unknown, callback?: unknown): boolean {
    if (typeof chunk === 'string') {
      this.#lines.push(chunk);
      return true;
    }

    return false;
  }

  output() {
    return this.#lines.join('');
  }
}
