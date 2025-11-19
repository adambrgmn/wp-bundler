import * as path from 'node:path';

import type { PluginBuild } from 'esbuild';
import { fs, vol } from 'memfs';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { fromPartial } from '../test-utils/utils.js';
import { define } from './define.js';

// @ts-expect-error ...
vi.mock(import('node:fs'), () => fs);

afterEach(() => {
  const contents = vol.toJSON();
  for (const key of Object.keys(contents)) {
    vol.rmSync(key);
  }
});

describe('plugin: define', () => {
  it('defines environment variables that can be used in the bundled assets', async () => {
    fs.writeFileSync('/.env', ['WP_ENV=test', 'NOT_INCLUDED=nope'].join('\n'));

    const build = await runPluginSetup('dev');
    expect(build.initialOptions.define).toHaveProperty('process.env.NODE_ENV', JSON.stringify('development'));
    expect(build.initialOptions.define).toHaveProperty('process.env.WP_ENV', JSON.stringify('test'));
    expect(build.initialOptions.define).not.toHaveProperty('process.env.NOT_INCLUDED');
  });

  it('will not overwrite variables set on process.env', async () => {
    process.env['WP_ENV'] = 'test';
    fs.writeFileSync('/.env', ['WP_ENV=production'].join('\n'));

    const build = await runPluginSetup('dev');
    expect(build.initialOptions.define).toHaveProperty('process.env.WP_ENV', JSON.stringify('test'));
    delete process.env['WP_ENV'];
  });

  it('will let different env files take precedence (development)', async () => {
    fs.writeFileSync('/.env', ['WP_FILE=.env'].join('\n'));
    fs.writeFileSync('/.env.development', ['WP_FILE=.env.development'].join('\n'));
    fs.writeFileSync('/.env.local', ['WP_FILE=.env.local'].join('\n'));
    fs.writeFileSync('/.env.development.local', ['WP_FILE=.env.development.local'].join('\n'));

    const build = await runPluginSetup('dev');
    expect(build.initialOptions.define).toHaveProperty('process.env.WP_FILE', JSON.stringify('.env.development.local'));
  });

  it('will let different env files take precedence (production)', async () => {
    fs.writeFileSync('/.env', ['WP_FILE=.env'].join('\n'));
    fs.writeFileSync('/.env.production', ['WP_FILE=.env.production'].join('\n'));
    fs.writeFileSync('/.env.local', ['WP_FILE=.env.local'].join('\n'));
    fs.writeFileSync('/.env.production.local', ['WP_FILE=.env.production.local'].join('\n'));

    const build = await runPluginSetup('prod');
    expect(build.initialOptions.define).toHaveProperty('process.env.WP_FILE', JSON.stringify('.env.production.local'));
  });

  it('will set initialOptions.define if it is not already set', async () => {
    const root = '/';
    const plugin = define(
      fromPartial({
        mode: 'dev',
        project: {
          paths: {
            absolute: (to: string, ...rest: string[]) => (path.isAbsolute(to) ? to : path.join(root, to, ...rest)),
          },
        },
      }),
    );

    const build = fromPartial<PluginBuild>({ initialOptions: {} });
    await plugin.setup(build);

    expect(build.initialOptions.define).toMatchInlineSnapshot(`
      {
        "process.env.NODE_ENV": ""development"",
      }
    `);
  });
});

async function runPluginSetup(mode: 'dev' | 'prod') {
  const root = '/';
  const plugin = define(
    fromPartial({
      mode,
      project: {
        paths: {
          absolute: (to: string, ...rest: string[]) => (path.isAbsolute(to) ? to : path.join(root, to, ...rest)),
        },
      },
    }),
  );

  const build = fromPartial<PluginBuild>({ initialOptions: { define: {} } });
  await plugin.setup(build);

  return build;
}
