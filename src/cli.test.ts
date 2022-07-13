import * as fs from 'node:fs';
import * as path from 'node:path';

import { execa } from 'execa';

import { existsSync } from './utils/exists';
import { rimraf } from './utils/rimraf';

const program = path.join(__dirname, '../cli.js');

const examples = path.join(__dirname, '..', 'examples');
const plugin = path.join(examples, './wp-bundler-plugin');
const theme = path.join(examples, './wp-bundler-theme');

beforeAll(() => {
  if (!existsSync(path.join(__dirname, '../dist/index.js'))) {
    throw new Error('You must run yarn build before running tests');
  }
});

beforeEach(() => {
  rimraf(path.join(plugin, 'dist'));
  rimraf(path.join(theme, 'dist'));
});

describe('Theme', () => {
  it('should build a proper theme in production mode', async () => {
    await $.theme('build');

    expect(read.theme()).toMatchInlineSnapshot(`
      Array [
        "AssetLoader.php",
        "admin.DB333OT5.js",
        "admin.FO3PWPK4.nomodule.js",
        "languages",
        "main.6OVZDUF3.js",
        "main.TGLZWPB2.css",
        "main.VXFGVGGY.nomodule.js",
      ]
    `);
  });
});

describe('Plugin', () => {
  it('should build a proper plugin in production mode', async () => {
    await $.plugin('build');

    expect(read.plugin()).toMatchInlineSnapshot(`
      Array [
        "AssetLoader.php",
        "admin.IMWKQWPT.js",
        "admin.YXSFU7UU.nomodule.js",
        "main.24T3P6PJ.js",
        "main.AXIEJDQJ.nomodule.js",
      ]
    `);
  });
});

describe('Build', () => {
  it('bundles js/ts in dev mode without transpilation', async () => {
    await $.plugin('build', ['--mode', 'dev']);
    expect(read.plugin('admin.js')).toMatchInlineSnapshot(`
      "// src/log.ts
      var log = (...messages2) => {
        console.log(...messages2);
      };

      // src/admin.ts
      var messages = [\\"Hello\\", \\"World\\"];
      log(...messages);
      //# sourceMappingURL=admin.js.map
      "
    `);
  });

  it('outputs minified js/ts in production mode', async () => {
    await $.plugin('build');
    let items = read.plugin();
    let admin = items.find((item) => item.endsWith('.js') && item.startsWith('admin')) as string;
    expect(read.plugin(admin)).toMatchInlineSnapshot(`
      "var o=(...l)=>{console.log(...l)};var e=[\\"Hello\\",\\"World\\"];o(...e);
      "
    `);
  });

  it('outputs transpiled nomodule version of javascript in production mode', async () => {
    await $.plugin('build');
    let items = read.plugin();
    let nomodule = items.find((item) => item.endsWith('.nomodule.js') && item.startsWith('admin')) as string;
    expect(read.plugin(nomodule)).toMatchInlineSnapshot(`
      "\\"use strict\\";(function(){function o(r,n){(n==null||n>r.length)&&(n=r.length);for(var t=0,e=new Array(n);t<n;t++)e[t]=r[t];return e}function i(r){if(Array.isArray(r))return o(r)}function l(r){if(typeof Symbol!=\\"undefined\\"&&r[Symbol.iterator]!=null||r[\\"@@iterator\\"]!=null)return Array.from(r)}function f(){throw new TypeError(\\"Invalid attempt to spread non-iterable instance.\\\\\\\\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.\\")}function y(r){return i(r)||l(r)||c(r)||f()}function c(r,n){if(!!r){if(typeof r==\\"string\\")return o(r,n);var t=Object.prototype.toString.call(r).slice(8,-1);if(t===\\"Object\\"&&r.constructor&&(t=r.constructor.name),t===\\"Map\\"||t===\\"Set\\")return Array.from(t);if(t===\\"Arguments\\"||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t))return o(r,n)}}var u=function(){for(var r=arguments.length,n=new Array(r),t=0;t<r;t++)n[t]=arguments[t];var e;(e=console).log.apply(e,y(n))};function a(r,n){(n==null||n>r.length)&&(n=r.length);for(var t=0,e=new Array(n);t<n;t++)e[t]=r[t];return e}function s(r){if(Array.isArray(r))return a(r)}function p(r){if(typeof Symbol!=\\"undefined\\"&&r[Symbol.iterator]!=null||r[\\"@@iterator\\"]!=null)return Array.from(r)}function b(){throw new TypeError(\\"Invalid attempt to spread non-iterable instance.\\\\\\\\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.\\")}function m(r){return s(r)||p(r)||A(r)||b()}function A(r,n){if(!!r){if(typeof r==\\"string\\")return a(r,n);var t=Object.prototype.toString.call(r).slice(8,-1);if(t===\\"Object\\"&&r.constructor&&(t=r.constructor.name),t===\\"Map\\"||t===\\"Set\\")return Array.from(t);if(t===\\"Arguments\\"||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t))return a(r,n)}}var d=[\\"Hello\\",\\"World\\"];u.apply(void 0,m(d));})();
      "
    `);
  });

  it('runs postcss and autoprefixer on css', async () => {
    await $.theme('build', ['--mode', 'dev']);
    expect(read.theme('main.css')).toMatchInlineSnapshot(`
      "/* src/variables.css */
      :root {
        --color-brand: rgba(0, 0, 255, 0.9);
      }

      /* src/main.css */
      ::-moz-placeholder {
        color: var(--color-brand);
      }
      ::placeholder {
        color: var(--color-brand);
      }
      /*# sourceMappingURL=main.css.map */
      "
    `);
  });

  it('outputs minified css in production mode', async () => {
    await $.theme('build');
    let items = read.theme();
    let main = items.find((item) => item.endsWith('.css') && item.startsWith('main')) as string;
    expect(read.theme(main)).toMatchInlineSnapshot(`
      ":root{--color-brand: rgba(0, 0, 255, .9)}::-moz-placeholder{color:var(--color-brand)}::placeholder{color:var(--color-brand)}
      "
    `);
  });
});

const $ = {
  theme(subcommand: 'build' | 'dev', flags: string[] = []) {
    return execa(program, [subcommand, ...flags], { cwd: theme });
  },
  plugin(subcommand: 'build' | 'dev', flags: string[] = []) {
    return execa(program, [subcommand, ...flags], { cwd: plugin });
  },
};

const read = {
  theme: createReader(theme),
  plugin: createReader(plugin),
};

function createReader(root: string) {
  function reader(): string[];
  function reader(file: string): string;
  function reader(file?: string) {
    if (file == null) return fs.readdirSync(path.join(root, 'dist'));
    return fs.readFileSync(path.join(root, 'dist', file), 'utf-8');
  }

  return reader;
}
