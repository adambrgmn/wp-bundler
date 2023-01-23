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
        "dist/admin.KRT7TWFX.js",
        "dist/admin.nomodule.K3AVKCJ4.js",
        "dist/languages/wp-bundler-theme-sv_SE-b3d4ea03d549de3b657a18b46bf56e02.json",
        "dist/main.NMV57XSA.js",
        "dist/main.TGLZWPB2.css",
        "dist/main.nomodule.BAHQUTN7.js",
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
        "dist/admin.EYKEWSYL.js",
        "dist/admin.nomodule.5UYSHB2K.js",
        "dist/main.UGCVKHPS.js",
        "dist/main.nomodule.NXTWLLGJ.js",
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
    let admin = outputFiles.find((file) => file.path.includes('admin.nomodule'));
    expect(admin?.text).toMatchInlineSnapshot(`
      "var S=(o,a)=>()=>(o&&(a=o(o=0)),a);var l=S(()=>{\\"use strict\\"});l();(function(){var o=function(n,t){return function(){return n&&(t=n(n=0)),t}},a=o(function(){\\"use strict\\"});a(),a();function i(n,t){(t==null||t>n.length)&&(t=n.length);for(var r=0,e=new Array(t);r<t;r++)e[r]=n[r];return e}function f(n){if(Array.isArray(n))return i(n)}function c(n){if(typeof Symbol<\\"u\\"&&n[Symbol.iterator]!=null||n[\\"@@iterator\\"]!=null)return Array.from(n)}function s(){throw new TypeError(\\"Invalid attempt to spread non-iterable instance.\\\\\\\\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.\\")}function y(n){return f(n)||c(n)||m(n)||s()}function m(n,t){if(n){if(typeof n==\\"string\\")return i(n,t);var r=Object.prototype.toString.call(n).slice(8,-1);if(r===\\"Object\\"&&n.constructor&&(r=n.constructor.name),r===\\"Map\\"||r===\\"Set\\")return Array.from(r);if(r===\\"Arguments\\"||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(r))return i(n,t)}}var p=function(){for(var n=arguments.length,t=new Array(n),r=0;r<n;r++)t[r]=arguments[r];var e;(e=console).log.apply(e,y(t))};function u(n,t){(t==null||t>n.length)&&(t=n.length);for(var r=0,e=new Array(t);r<t;r++)e[r]=n[r];return e}function b(n){if(Array.isArray(n))return u(n)}function d(n){if(typeof Symbol<\\"u\\"&&n[Symbol.iterator]!=null||n[\\"@@iterator\\"]!=null)return Array.from(n)}function g(){throw new TypeError(\\"Invalid attempt to spread non-iterable instance.\\\\\\\\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.\\")}function A(n){return b(n)||d(n)||v(n)||g()}function v(n,t){if(n){if(typeof n==\\"string\\")return u(n,t);var r=Object.prototype.toString.call(n).slice(8,-1);if(r===\\"Object\\"&&n.constructor&&(r=n.constructor.name),r===\\"Map\\"||r===\\"Set\\")return Array.from(r);if(r===\\"Arguments\\"||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(r))return u(n,t)}}var h=[\\"Hello\\",\\"World\\"];p.apply(void 0,A(h))})();
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
