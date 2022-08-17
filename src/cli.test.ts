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
        "admin.BRZ25XL2.nomodule.js",
        "admin.KRT7TWFX.js",
        "languages",
        "main.A4RZX4NB.nomodule.js",
        "main.TGLZWPB2.css",
        "main.UNJITHPP.js",
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
        "admin.B2QIUYTG.nomodule.js",
        "admin.EYKEWSYL.js",
        "main.DPDP3RVU.nomodule.js",
        "main.ZY3XGKPK.js",
      ]
    `);
  });
});

describe('Build', () => {
  it('bundles js/ts in dev mode without transpilation', async () => {
    await $.plugin('build', ['--mode', 'dev']);
    expect(read.plugin('admin.js')).toMatchInlineSnapshot(`
      "var __getOwnPropNames = Object.getOwnPropertyNames;
      var __esm = (fn, res) => function __init() {
        return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
      };

      // ../../assets/wp-element/wp-element.ts
      var init_wp_element = __esm({
        \\"../../assets/wp-element/wp-element.ts\\"() {
          \\"use strict\\";
        }
      });

      // src/admin.ts
      init_wp_element();

      // src/log.ts
      init_wp_element();
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
      "\\"use strict\\";(function(){var f=function(r,e){return function(){return r&&(e=r(r=0)),e}};var o=f(function(){\\"use strict\\"});o();o();function a(r,e){(e==null||e>r.length)&&(e=r.length);for(var t=0,n=new Array(e);t<e;t++)n[t]=r[t];return n}function y(r){if(Array.isArray(r))return a(r)}function c(r){if(typeof Symbol!=\\"undefined\\"&&r[Symbol.iterator]!=null||r[\\"@@iterator\\"]!=null)return Array.from(r)}function s(){throw new TypeError(\\"Invalid attempt to spread non-iterable instance.\\\\\\\\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.\\")}function m(r){return y(r)||c(r)||p(r)||s()}function p(r,e){if(!!r){if(typeof r==\\"string\\")return a(r,e);var t=Object.prototype.toString.call(r).slice(8,-1);if(t===\\"Object\\"&&r.constructor&&(t=r.constructor.name),t===\\"Map\\"||t===\\"Set\\")return Array.from(t);if(t===\\"Arguments\\"||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t))return a(r,e)}}var l=function(){for(var r=arguments.length,e=new Array(r),t=0;t<r;t++)e[t]=arguments[t];var n;(n=console).log.apply(n,m(e))};function i(r,e){(e==null||e>r.length)&&(e=r.length);for(var t=0,n=new Array(e);t<e;t++)n[t]=r[t];return n}function b(r){if(Array.isArray(r))return i(r)}function A(r){if(typeof Symbol!=\\"undefined\\"&&r[Symbol.iterator]!=null||r[\\"@@iterator\\"]!=null)return Array.from(r)}function d(){throw new TypeError(\\"Invalid attempt to spread non-iterable instance.\\\\\\\\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.\\")}function g(r){return b(r)||A(r)||_(r)||d()}function _(r,e){if(!!r){if(typeof r==\\"string\\")return i(r,e);var t=Object.prototype.toString.call(r).slice(8,-1);if(t===\\"Object\\"&&r.constructor&&(t=r.constructor.name),t===\\"Map\\"||t===\\"Set\\")return Array.from(t);if(t===\\"Arguments\\"||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t))return i(r,e)}}var h=[\\"Hello\\",\\"World\\"];l.apply(void 0,g(h));})();
      "
    `);
  });

  it('outputs transpiled nomodule version of javascript in production mode', async () => {
    await $.plugin('build');
    let items = read.plugin();
    let nomodule = items.find((item) => item.endsWith('.nomodule.js') && item.startsWith('admin')) as string;
    expect(read.plugin(nomodule)).toMatchInlineSnapshot(`
      "\\"use strict\\";(function(){var f=function(r,e){return function(){return r&&(e=r(r=0)),e}};var o=f(function(){\\"use strict\\"});o();o();function a(r,e){(e==null||e>r.length)&&(e=r.length);for(var t=0,n=new Array(e);t<e;t++)n[t]=r[t];return n}function y(r){if(Array.isArray(r))return a(r)}function c(r){if(typeof Symbol!=\\"undefined\\"&&r[Symbol.iterator]!=null||r[\\"@@iterator\\"]!=null)return Array.from(r)}function s(){throw new TypeError(\\"Invalid attempt to spread non-iterable instance.\\\\\\\\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.\\")}function m(r){return y(r)||c(r)||p(r)||s()}function p(r,e){if(!!r){if(typeof r==\\"string\\")return a(r,e);var t=Object.prototype.toString.call(r).slice(8,-1);if(t===\\"Object\\"&&r.constructor&&(t=r.constructor.name),t===\\"Map\\"||t===\\"Set\\")return Array.from(t);if(t===\\"Arguments\\"||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t))return a(r,e)}}var l=function(){for(var r=arguments.length,e=new Array(r),t=0;t<r;t++)e[t]=arguments[t];var n;(n=console).log.apply(n,m(e))};function i(r,e){(e==null||e>r.length)&&(e=r.length);for(var t=0,n=new Array(e);t<e;t++)n[t]=r[t];return n}function b(r){if(Array.isArray(r))return i(r)}function A(r){if(typeof Symbol!=\\"undefined\\"&&r[Symbol.iterator]!=null||r[\\"@@iterator\\"]!=null)return Array.from(r)}function d(){throw new TypeError(\\"Invalid attempt to spread non-iterable instance.\\\\\\\\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.\\")}function g(r){return b(r)||A(r)||_(r)||d()}function _(r,e){if(!!r){if(typeof r==\\"string\\")return i(r,e);var t=Object.prototype.toString.call(r).slice(8,-1);if(t===\\"Object\\"&&r.constructor&&(t=r.constructor.name),t===\\"Map\\"||t===\\"Set\\")return Array.from(t);if(t===\\"Arguments\\"||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t))return i(r,e)}}var h=[\\"Hello\\",\\"World\\"];l.apply(void 0,g(h));})();
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
