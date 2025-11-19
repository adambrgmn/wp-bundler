import * as path from 'node:path';

import type { BuildContext } from 'esbuild';
import { afterEach, describe, expect, it } from 'vitest';

import { createContext } from './context.js';
import { TestLogger } from './test-utils/extensions.js';
import type { Mode } from './types.js';
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
        "dist/main.css.map",
        "dist/main.css",
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

    expect(
      files
        .content('admin')
        .replace(/\/\/# sourceMappingURL=.+/, '')
        .trim(),
    ).toMatchInlineSnapshot(`
      "var __getOwnPropNames = Object.getOwnPropertyNames;
      var __esm = (fn, res) => function __init() {
        return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
      };

      // ../../assets/wp-element/wp-element.ts
      var init_wp_element = __esm({
        "../../assets/wp-element/wp-element.ts"() {
          "use strict";
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
      var messages = ["Hello", "World"];
      log(...messages);"
    `);
  });

  it('outputs minified js/ts in production mode', async () => {
    let [context] = await createTestContext('plugin', 'prod');
    let files = await bundle(context);
    expect(files.content('admin')).toMatchInlineSnapshot(`
      "var m=(e,r)=>()=>(e&&(r=e(e=0)),r);var o=m(()=>{"use strict"});o();o();var l=(...e)=>{console.log(...e)};var s=["Hello","World"];l(...s);
      "
    `);
  });

  it('outputs transpiled nomodule version of javascript in production mode', async () => {
    let [context] = await createTestContext('plugin', 'prod');
    let files = await bundle(context);
    expect(files.content('admin.nomodule')).toMatchInlineSnapshot(`
      "var S=(o,a)=>()=>(o&&(a=o(o=0)),a);var l=S(()=>{"use strict"});l();(function(){var o=function(n,t){return function(){return n&&(t=n(n=0)),t}},a=o(function(){"use strict"});a(),a();function i(n,t){(t==null||t>n.length)&&(t=n.length);for(var r=0,e=new Array(t);r<t;r++)e[r]=n[r];return e}function f(n){if(Array.isArray(n))return i(n)}function c(n){if(typeof Symbol<"u"&&n[Symbol.iterator]!=null||n["@@iterator"]!=null)return Array.from(n)}function s(){throw new TypeError("Invalid attempt to spread non-iterable instance.\\\\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}function y(n){return f(n)||c(n)||m(n)||s()}function m(n,t){if(n){if(typeof n=="string")return i(n,t);var r=Object.prototype.toString.call(n).slice(8,-1);if(r==="Object"&&n.constructor&&(r=n.constructor.name),r==="Map"||r==="Set")return Array.from(r);if(r==="Arguments"||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(r))return i(n,t)}}var p=function(){for(var n=arguments.length,t=new Array(n),r=0;r<n;r++)t[r]=arguments[r];var e;(e=console).log.apply(e,y(t))};function u(n,t){(t==null||t>n.length)&&(t=n.length);for(var r=0,e=new Array(t);r<t;r++)e[r]=n[r];return e}function b(n){if(Array.isArray(n))return u(n)}function d(n){if(typeof Symbol<"u"&&n[Symbol.iterator]!=null||n["@@iterator"]!=null)return Array.from(n)}function g(){throw new TypeError("Invalid attempt to spread non-iterable instance.\\\\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}function A(n){return b(n)||d(n)||v(n)||g()}function v(n,t){if(n){if(typeof n=="string")return u(n,t);var r=Object.prototype.toString.call(n).slice(8,-1);if(r==="Object"&&n.constructor&&(r=n.constructor.name),r==="Map"||r==="Set")return Array.from(r);if(r==="Arguments"||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(r))return u(n,t)}}var h=["Hello","World"];p.apply(void 0,A(h))})();
      "
    `);
  });

  it('runs postcss and autoprefixer on css', async () => {
    let [context] = await createTestContext('theme', 'dev');
    let files = await bundle(context);
    expect(
      files
        .content('main', 'css')
        .replace(/\/\*# sourceMappingURL=.+/, '')
        .trim(),
    ).toMatchInlineSnapshot(`
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
      }"
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

    expect(content).toContain('var bug_default = ');
    expect(content).toContain('viewBox: "0 0 24 24"');
    // expect(content).toMatchInlineSnapshot();
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
