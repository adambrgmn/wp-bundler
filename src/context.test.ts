import * as path from 'node:path';

import { BuildContext } from 'esbuild';
import { afterEach, describe, expect, it } from 'vitest';

import { createContext } from './context.js';
import { TestLogger } from './test-utils/extensions.js';
import { Mode } from './types.js';
import { dirname } from './utils/dirname.js';
import { getMetadata } from './utils/read-pkg.js';

describe('theme', () => {
  it.skip('generates the expected output in prod mode', async () => {
    let [context, logger] = await createTestContext('theme', 'prod');
    let result = await context.rebuild();
    let output = cleanOutput(logger);

    expect(output).toMatchInlineSnapshot(`
      "▶  WP-BUNDLER  Running bundler in prod mode.
      ▶  WP-BUNDLER  Building...

      main
      dist/main.NMV57XSA.js
      dist/main.TGLZWPB2.css
      dist/main.nomodule.BAHQUTN7.js

      admin
      dist/admin.KRT7TWFX.js
      dist/admin.nomodule.K3AVKCJ4.js

      asset-loader
      dist/AssetLoader.php

      translations
      languages/theme.pot
      languages/sv_SE.po
      languages/sv_SE.mo
      dist/languages/wp-bundler-theme-sv_SE-b3d4ea03d549de3b657a18b46bf56e02.json

      ✔  WP-BUNDLER  Build succeeded in XX ms."
    `);

    expect(Object.keys(result.metafile?.outputs ?? {})).toMatchInlineSnapshot(`
      [
        "dist/main.NMV57XSA.js",
        "dist/main.TGLZWPB2.css",
        "dist/main.nomodule.BAHQUTN7.js",
        "dist/admin.KRT7TWFX.js",
        "dist/admin.nomodule.K3AVKCJ4.js",
        "dist/AssetLoader.php",
        "languages/theme.pot",
        "languages/sv_SE.po",
        "languages/sv_SE.mo",
        "dist/languages/wp-bundler-theme-sv_SE-b3d4ea03d549de3b657a18b46bf56e02.json",
      ]
    `);
  });
  it('generates the expected output in dev mode', async () => {
    let [context] = await createTestContext('theme', 'dev');
    let result = await context.rebuild();
    expect(Object.keys(result.metafile?.outputs ?? {})).toMatchInlineSnapshot(`
      [
        "dist/main.js.map",
        "dist/main.js",
        "dist/main.css.map",
        "dist/main.css",
        "dist/admin.js.map",
        "dist/admin.js",
        "dist/AssetLoader.php",
        "languages/theme.pot",
        "languages/sv_SE.po",
        "languages/sv_SE.mo",
        "dist/languages/wp-bundler-theme-sv_SE-2770833218bd08d0b5d0c0157cfef742.json",
      ]
    `);
  });
});

describe('plugin', () => {
  it.skip('generates the expected output in prod mode', async () => {
    let [context, logger] = await createTestContext('plugin', 'prod');
    let result = await context.rebuild();
    let output = cleanOutput(logger);

    expect(output).toMatchInlineSnapshot(`
      "▶  WP-BUNDLER  Running bundler in prod mode.
      ▶  WP-BUNDLER  Building...

      main
      dist/main.UGCVKHPS.js
      dist/main.nomodule.NXTWLLGJ.js

      admin
      dist/admin.EYKEWSYL.js
      dist/admin.nomodule.5UYSHB2K.js

      asset-loader
      dist/AssetLoader.php

      ✔  WP-BUNDLER  Build succeeded in XX ms."
    `);

    expect(Object.keys(result.metafile?.outputs ?? {})).toMatchInlineSnapshot(`
      [
        "dist/main.UGCVKHPS.js",
        "dist/main.nomodule.NXTWLLGJ.js",
        "dist/admin.EYKEWSYL.js",
        "dist/admin.nomodule.5UYSHB2K.js",
        "dist/AssetLoader.php",
      ]
    `);
  });

  it('generates the expected output in dev mode', async () => {
    let [context] = await createTestContext('plugin', 'dev');
    let result = await context.rebuild();
    expect(Object.keys(result.metafile?.outputs ?? {})).toMatchInlineSnapshot(`
      [
        "dist/main.js.map",
        "dist/main.js",
        "dist/admin.js.map",
        "dist/admin.js",
        "dist/AssetLoader.php",
      ]
    `);
  });
});

describe('output', () => {
  it('bundles js/ts in dev mode without transpilation', async () => {
    let [context] = await createTestContext('plugin', 'dev');
    let files = await bundle(context);

    expect(files.content('admin')).toMatchInlineSnapshot(`
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
    let [context] = await createTestContext('plugin', 'prod');
    let files = await bundle(context);
    expect(files.content('admin')).toMatchInlineSnapshot(`
      "var m=(e,r)=>()=>(e&&(r=e(e=0)),r);var o=m(()=>{\\"use strict\\"});o();o();var l=(...e)=>{console.log(...e)};var s=[\\"Hello\\",\\"World\\"];l(...s);
      "
    `);
  });

  it('outputs transpiled nomodule version of javascript in production mode', async () => {
    let [context] = await createTestContext('plugin', 'prod');
    let files = await bundle(context);
    expect(files.content('admin.nomodule')).toMatchInlineSnapshot(`
      "(function(){function o(r,n){(n==null||n>r.length)&&(n=r.length);for(var t=0,e=new Array(n);t<n;t++)e[t]=r[t];return e}function i(r){if(Array.isArray(r))return o(r)}function l(r){if(typeof Symbol!=\\"undefined\\"&&r[Symbol.iterator]!=null||r[\\"@@iterator\\"]!=null)return Array.from(r)}function c(){throw new TypeError(\\"Invalid attempt to spread non-iterable instance.\\\\\\\\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.\\")}function a(r){return i(r)||l(r)||f(r)||c()}function f(r,n){if(r){if(typeof r==\\"string\\")return o(r,n);var t=Object.prototype.toString.call(r).slice(8,-1);if(t===\\"Object\\"&&r.constructor&&(t=r.constructor.name),t===\\"Map\\"||t===\\"Set\\")return Array.from(t);if(t===\\"Arguments\\"||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t))return o(r,n)}}var s=function(r,n){return function(){return r&&(n=r(r=0)),n}},y=s(function(){\\"use strict\\"});y();var p=Object.getOwnPropertyNames,m=function(r,n){return function(){return r&&(n=(0,r[p(r)[0]])(r=0)),n}},u=m({\\"../../assets/wp-element/wp-element.ts\\":function(){\\"use strict\\"}});u();u();var b=function(){for(var r=arguments.length,n=new Array(r),t=0;t<r;t++)n[t]=arguments[t];var e;(e=console).log.apply(e,a(n))},A=[\\"Hello\\",\\"World\\"];b.apply(void 0,a(A));})();
      "
    `);
  });

  it('runs postcss and autoprefixer on css', async () => {
    let [context] = await createTestContext('theme', 'dev');
    let files = await bundle(context);
    expect(files.content('main', 'css')).toMatchInlineSnapshot(`
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
    let [context] = await createTestContext('theme', 'prod');
    let files = await bundle(context);
    expect(files.content('main', 'css')).toMatchInlineSnapshot(`
      ":root{--color-brand: rgba(0, 0, 255, .9)}::-moz-placeholder{color:var(--color-brand)}::placeholder{color:var(--color-brand)}
      "
    `);
  });

  it('should include @wordpress/icons in bundle', async () => {
    let [context] = await createTestContext('theme', 'dev');
    let files = await bundle(context);
    let content = files.content('main');

    expect(content).toContain('var bug = ');
    expect(content).toContain('viewBox: "0 0 24 24"');
    expect(content).toMatchInlineSnapshot(`
      "var __create = Object.create;
      var __defProp = Object.defineProperty;
      var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
      var __getOwnPropNames = Object.getOwnPropertyNames;
      var __getProtoOf = Object.getPrototypeOf;
      var __hasOwnProp = Object.prototype.hasOwnProperty;
      var __esm = (fn, res) => function __init() {
        return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
      };
      var __commonJS = (cb, mod) => function __require() {
        return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
      };
      var __copyProps = (to, from, except, desc) => {
        if (from && typeof from === \\"object\\" || typeof from === \\"function\\") {
          for (let key of __getOwnPropNames(from))
            if (!__hasOwnProp.call(to, key) && key !== except)
              __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
        }
        return to;
      };
      var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
        // If the importer is in node compatibility mode or this is not an ESM
        // file that has been converted to a CommonJS file using a Babel-
        // compatible transform (i.e. \\"__esModule\\" has not been set), then set
        // \\"default\\" to the CommonJS \\"module.exports\\" for node compatibility.
        isNodeMode || !mod || !mod.__esModule ? __defProp(target, \\"default\\", { value: mod, enumerable: true }) : target,
        mod
      ));

      // _wp-bundler-wp-externals:@wordpress/element
      var require_element = __commonJS({
        \\"_wp-bundler-wp-externals:@wordpress/element\\"(exports, module) {
          init_wp_element();
          module.exports = window.wp.element;
        }
      });

      // ../../assets/wp-element/wp-element.ts
      var init_wp_element = __esm({
        \\"../../assets/wp-element/wp-element.ts\\"() {
          \\"use strict\\";
        }
      });

      // _wp-bundler-wp-externals:@wordpress/i18n
      var require_i18n = __commonJS({
        \\"_wp-bundler-wp-externals:@wordpress/i18n\\"(exports, module) {
          init_wp_element();
          module.exports = window.wp.i18n;
        }
      });

      // _wp-bundler-wp-externals:@wordpress/primitives
      var require_primitives = __commonJS({
        \\"_wp-bundler-wp-externals:@wordpress/primitives\\"(exports, module) {
          init_wp_element();
          module.exports = window.wp.primitives;
        }
      });

      // src/main.ts
      init_wp_element();
      var import_i18n = __toESM(require_i18n());

      // ../../node_modules/@wordpress/icons/build-module/index.js
      init_wp_element();

      // ../../node_modules/@wordpress/icons/build-module/library/bug.js
      init_wp_element();
      var import_element = __toESM(require_element());
      var import_primitives = __toESM(require_primitives());
      var bug = (0, import_element.createElement)(import_primitives.SVG, {
        xmlns: \\"http://www.w3.org/2000/svg\\",
        viewBox: \\"0 0 24 24\\"
      }, (0, import_element.createElement)(import_primitives.Path, {
        d: \\"M6.13 5.5l1.926 1.927A4.975 4.975 0 007.025 10H5v1.5h2V13H5v1.5h2.1a5.002 5.002 0 009.8 0H19V13h-2v-1.5h2V10h-2.025a4.979 4.979 0 00-1.167-2.74l1.76-1.76-1.061-1.06-1.834 1.834A4.977 4.977 0 0012 5.5c-1.062 0-2.046.33-2.855.895L7.19 4.44 6.13 5.5zm2.37 5v3a3.5 3.5 0 107 0v-3a3.5 3.5 0 10-7 0z\\",
        fillRule: \\"evenodd\\",
        clipRule: \\"evenodd\\"
      }));
      var bug_default = bug;

      // src/main.ts
      console.log((0, import_i18n.__)(\\"Hello world! (theme)\\", \\"wp-bundler-theme\\"));
      console.log(bug_default);
      //# sourceMappingURL=main.js.map
      "
    `);
  });
});

const createdContexts = new Set<BuildContext>();
afterEach(async () => {
  for (let ctx of createdContexts) {
    await ctx.dispose();
    createdContexts.delete(ctx);
  }
});

const { __dirname } = dirname(import.meta.url);

const paths = {
  plugin: path.join(__dirname, '../examples/wp-bundler-plugin'),
  theme: path.join(__dirname, '../examples/wp-bundler-theme'),
} as const;

async function createTestContext(kind: keyof typeof paths, mode: Mode) {
  let meta = getMetadata(paths[kind], __dirname);
  let logger = new TestLogger('WP-BUNDLER');
  let options = {
    write: false,
    mode,
    watch: false,
    host: 'localhost',
    port: 3000,
    cwd: paths[kind],
    logger,
    ...meta,
  } as const;

  let ctx = await createContext(options);
  createdContexts.add(ctx);

  return [ctx, logger] as const;
}

async function bundle(context: BuildContext) {
  let result = await context.rebuild();
  return {
    content: (name: string, extension = 'js') => {
      let file = result.outputFiles?.find((output) => {
        return output.path.includes(name) && output.path.endsWith(extension);
      });
      return file?.text ?? '';
    },
  };
}

function cleanOutput(logger: TestLogger) {
  return logger
    .getOutput()
    .replace(/\d+ ms/, 'XX ms')
    .split('\n')
    .map((l) => l.trim())
    .join('\n')
    .trim();
}
