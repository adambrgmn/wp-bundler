import * as path from 'node:path';

import { describe, expect, it } from 'vitest';

import { Bundler } from './bundler.js';
import { BundlerOptions } from './types.js';
import { dirname } from './utils/dirname.js';
import { getMetadata } from './utils/read-pkg.js';

const { __dirname } = dirname(import.meta.url);

describe('Theme', () => {
  it('should build a proper theme in production mode', async () => {
    let { outputFiles } = await bundle('theme');
    expect(outputFiles.map((file) => file.path).sort()).toMatchInlineSnapshot(`
      [
        "dist/AssetLoader.php",
        "dist/admin.BRZ25XL2.nomodule.js",
        "dist/admin.KRT7TWFX.js",
        "dist/languages/wp-bundler-theme-sv_SE-4ab6a619862dd109dd5d98b79223f0c0.json",
        "dist/main.GSEJHYHX.js",
        "dist/main.RARWFVT3.nomodule.js",
        "dist/main.TGLZWPB2.css",
        "languages/sv_SE.mo",
        "languages/sv_SE.po",
        "languages/theme.pot",
      ]
    `);
  });
});

describe('Plugin', () => {
  it('should build a proper plugin in production mode', async () => {
    let { outputFiles } = await bundle('plugin');
    expect(outputFiles.map((file) => file.path).sort()).toMatchInlineSnapshot(`
      [
        "dist/AssetLoader.php",
        "dist/admin.B2QIUYTG.nomodule.js",
        "dist/admin.EYKEWSYL.js",
        "dist/main.KINSPPQM.nomodule.js",
        "dist/main.ZY3XGKPK.js",
      ]
    `);
  });
});

describe('Build', () => {
  it('bundles js/ts in dev mode without transpilation', async () => {
    let { outputFiles } = await bundle('plugin', { mode: 'dev' });
    let admin = outputFiles.find((file) => file.path.endsWith('admin.js'));
    expect(admin?.text).toMatchInlineSnapshot(`
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
    let { outputFiles } = await bundle('plugin', { mode: 'prod' });
    let admin = outputFiles.find(
      (file) => file.path.includes('admin') && !file.path.includes('nomodule') && file.path.endsWith('.js'),
    );
    expect(admin?.text).toMatchInlineSnapshot(`
      "var m=(e,r)=>()=>(e&&(r=e(e=0)),r);var o=m(()=>{\\"use strict\\"});o();o();var l=(...e)=>{console.log(...e)};var s=[\\"Hello\\",\\"World\\"];l(...s);
      "
    `);
  });

  it('outputs transpiled nomodule version of javascript in production mode', async () => {
    let { outputFiles } = await bundle('plugin', { mode: 'prod' });
    let admin = outputFiles.find((file) => file.path.includes('admin') && file.path.endsWith('.nomodule.js'));
    expect(admin?.text).toMatchInlineSnapshot(`
      "\\"use strict\\";(function(){var f=function(r,e){return function(){return r&&(e=r(r=0)),e}};var o=f(function(){\\"use strict\\"});o();o();function a(r,e){(e==null||e>r.length)&&(e=r.length);for(var t=0,n=new Array(e);t<e;t++)n[t]=r[t];return n}function y(r){if(Array.isArray(r))return a(r)}function c(r){if(typeof Symbol!=\\"undefined\\"&&r[Symbol.iterator]!=null||r[\\"@@iterator\\"]!=null)return Array.from(r)}function s(){throw new TypeError(\\"Invalid attempt to spread non-iterable instance.\\\\\\\\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.\\")}function m(r){return y(r)||c(r)||p(r)||s()}function p(r,e){if(!!r){if(typeof r==\\"string\\")return a(r,e);var t=Object.prototype.toString.call(r).slice(8,-1);if(t===\\"Object\\"&&r.constructor&&(t=r.constructor.name),t===\\"Map\\"||t===\\"Set\\")return Array.from(t);if(t===\\"Arguments\\"||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t))return a(r,e)}}var l=function(){for(var r=arguments.length,e=new Array(r),t=0;t<r;t++)e[t]=arguments[t];var n;(n=console).log.apply(n,m(e))};function i(r,e){(e==null||e>r.length)&&(e=r.length);for(var t=0,n=new Array(e);t<e;t++)n[t]=r[t];return n}function b(r){if(Array.isArray(r))return i(r)}function A(r){if(typeof Symbol!=\\"undefined\\"&&r[Symbol.iterator]!=null||r[\\"@@iterator\\"]!=null)return Array.from(r)}function d(){throw new TypeError(\\"Invalid attempt to spread non-iterable instance.\\\\\\\\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.\\")}function g(r){return b(r)||A(r)||_(r)||d()}function _(r,e){if(!!r){if(typeof r==\\"string\\")return i(r,e);var t=Object.prototype.toString.call(r).slice(8,-1);if(t===\\"Object\\"&&r.constructor&&(t=r.constructor.name),t===\\"Map\\"||t===\\"Set\\")return Array.from(t);if(t===\\"Arguments\\"||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t))return i(r,e)}}var h=[\\"Hello\\",\\"World\\"];l.apply(void 0,g(h));})();
      "
    `);
  });

  it('runs postcss and autoprefixer on css', async () => {
    let { outputFiles } = await bundle('theme', { mode: 'dev' });
    let main = outputFiles.find((file) => file.path.endsWith('main.css'));
    expect(main?.text).toMatchInlineSnapshot(`
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
    let { outputFiles } = await bundle('theme', { mode: 'prod' });
    let main = outputFiles.find((file) => file.path.startsWith('dist/main') && file.path.endsWith('.css'));
    expect(main?.text).toMatchInlineSnapshot(`
      ":root{--color-brand: rgba(0, 0, 255, .9)}::-moz-placeholder{color:var(--color-brand)}::placeholder{color:var(--color-brand)}
      "
    `);
  });

  it('should include @wordpress/icons in bundle', async () => {
    let { outputFiles } = await bundle('theme', { mode: 'dev' });
    let main = outputFiles.find((file) => file.path.endsWith('main.js'));

    expect(main?.text).toContain('var bug = ');
    expect(main?.text).toContain('viewBox: "0 0 24 24"');
    expect(main?.text).toMatchInlineSnapshot(`
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

const paths = {
  plugin: path.join(__dirname, '../examples/wp-bundler-plugin'),
  theme: path.join(__dirname, '../examples/wp-bundler-theme'),
} as const;

function bundle(kind: keyof typeof paths, options: Partial<Omit<BundlerOptions, 'cwd'>> = {}) {
  let meta = getMetadata(paths[kind], __dirname);
  let finalOptions: BundlerOptions = {
    mode: 'prod',
    watch: false,
    host: 'localhost',
    port: 3000,
    ...meta,
    ...options,
  };
  let bundler = new Bundler(finalOptions);

  bundler.prepare();
  return bundler.build();
}
