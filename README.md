# WP Bundler

WP Bundler is a minimal and fast bundler for your WordPress front end assets. It is a "thin" wrapper around [`esbuild`](https://esbuild.github.io/) with built-in support for translations. It handles all of your front end assets including Javascript (with Typescript and React support), CSS and other static assets imported in these, e.g. images and fonts.

It will output modern Javascript for modern browsers as well as a "legacy" version of your scripts for older browsers meaning that you will not send unneccessary content to modern browsers, while keeping the same functionality for older browsers as well.

- [Installation](#installation)
- [Cli](#cli)
- [Configuration](#configuration)
  - [`BundlerConfig.entryPoints` (required)](#bundlerconfigentrypoints-required)
  - [`BundlerConfig.outdir` (optional)](#bundlerconfigoutdir-optional)
  - [`BundlerConfig.sourcemap` (optional)](#bundlerconfigsourcemap-optional)
  - [`BundlerConfig.externals` (optional)](#bundlerconfigexternals-optional)
  - [`BundlerConfig.assetLoader` (optional)](#bundlerconfigassetloader-optional)
  - [`BundlerConfig.translations` (optional)](#bundlerconfigtranslations-optional)
- [Development](#development)
- [Asset types](#asset-types)
  - [Javascript and Typescript](#javascript-and-typescript)
  - [CSS](#css)
    - [CSS modules](#css-modules)
- [Asset loader](#asset-loader)
  - [Usage](#usage)
- [External dependencies](#external-dependencies)
- [Translations](#translations)
  - [PHP and Twig translations](#php-and-twig-translations)
- [Environment variables](#environment-variables)
  - [Other injected variables](#other-injected-variables)
  - [Other `.env` files](#other-env-files)
- [Other WordPress focused bundlers](#other-wordpress-focused-bundlers)
- [LICENSE](#license)

## Installation

Install the bundler locally as a dependency of you theme or plugin.

```shell
$ npm i -d @fransvilhelm/wp-bundler
$ yarn add --dev @fransvilhelm/wp-bundler
```

Then configure the scripts in your `package.json`.

```json
{
  "scripts": {
    "build": "wp-bundler build",
    "dev": "wp-bundler dev"
  }
}
```

## Cli

```shell
$ wp-bundler --help
  wp-bundler [command]

  Commands:
    wp-bundler build  Create production ready version of your project
    wp-bundler dev    Run a development server

  Options:
    --help     Show help                                                 [boolean]
    --version  Show version number                                       [boolean]
```

```shell
$ wp-bundler build --help
  wp-bundler build

  Create production ready version of your project

  Options:
        --help     Show help                                             [boolean]
        --version  Show version number                                   [boolean]
    -m, --mode     Version of your source to output
                                        [choices: "dev", "prod"] [default: "prod"]
        --cwd      Optional path to your project                          [string]
```

```shell
$ wp-bundler dev --help
  wp-bundler dev

  Run a development server

  Options:
        --help     Show help                                             [boolean]
        --version  Show version number                                   [boolean]
    -h, --host     Host to bind the server to               [default: "localhost"]
    -p, --port     Port to bind the server to                      [default: 3000]
    -m, --mode     Version of your source to output
                                        [choices: "dev", "prod"] [default: "dev"]
        --cwd      Optional path to your project                          [string]
```

## Configuration

There are _three_ places in which you can configure `wp-bundler`. Either in your projects `package.json` under the property `"wp-bundler"`, or in any of the files `.wp-bundlerrc` and `wp-bundler.config.json`.

Below is an example configuration with all available configuration options used:

```json
{
  "entryPoints": {
    "app": "src/app.ts",
    "admin": "src/admin.ts"
  },
  "outdir": "dist",
  "sourcemap": true,
  "externals": { "lodash": "_" },
  "assetLoader": {
    "path": "inc/AssetLoader.php",
    "namespace": "MyNamespace"
  },
  "translations": {
    "domain": "theme-domain",
    "pot": "languages/theme.pot",
    "pos": ["languages/sv_SE.po", "languages/en_US.po"]
  }
}
```

The app uses schema validation logic to validate the configuration. The actual schema can be found in [`./src/schema.ts`](./src/schema.ts).

### `BundlerConfig.entryPoints` (required)

- **Type:** `Record<string, string>`

`entryPoints` is used to tell the bundler which source files we care about. It should be an object with string values. The keys (`app` and `admin`) in the above example can later be used to load the assets with the [`AssetLoader`](#asset-loader).

The values should point to source files, most often it is `.js` (or `.ts`) files, but it can also be `.css` files. The files will be bundled by `esbuild` and placed in the output directory (same directory as your `package.json`).

The paths should be referenced as relative to your projects root directory.

You don't have to specify one entry point for css and one for js if they are tightly coupled. Instead you can import the css from your js source (`import './app.css'`).

### `BundlerConfig.outdir` (optional)

- **Type:** `string`
- **Default:** `'dist'`

`outdir` is the directory in which to put your assets. It should be referenced as relative to your projects root directory (same directory as your `package.json`).

### `BundlerConfig.sourcemap` (optional)

- **Type:** `boolean`
- **Default:** `undefined`

Tell the bundler to output sourcemaps together with the bundled output. This option is optional and defaults to `true` when you run `wp-bundler dev` and `false` when you run `wp-bundler build`.

### `BundlerConfig.externals` (optional)

- **Type:** `Record<string, string>`
- **Default:** `undefined`

If you are loading some libraries from e.g. a cdn or in some other fashion you can tell `wp-bundler` to ignore those libraries and instead "import" them from the `window` object. The key should be the name of the dependency and the value should be the key used to access it from `window`.

**Example:** Given the following config: `{ "externals": { "lodash": "_" } }` the library will skip bundling `lodash` and instead access it from `window._`.

Built-in dependencies, e.g. jQuery, React and WordPress libraries are [handled automatically](#external-dependencies).

### `BundlerConfig.assetLoader` (optional)

- **Type:** `{ path?: string; namespace?: string }`
- **Default:** `{ path: './AssetLoader.php', namespace: 'WPBundler' }`

The `AssetLoader` is a php file that is emitted as part of the `build` and `dev` scripts. It can be used to load assets as part of the WordPress workflow. With these options you can specify the location of the emitted `AssetLoader` and also which namespace should be used. [Read more](#asset-loader).

### `BundlerConfig.translations` (optional)

- **Types:** `{ domain: string; pot: string; pos?: string[] }`
- **Default:** `undefined`

Configure if translations are enabled and if so where translations should live and how to handle them. [Read more](#translations).

## Development

During development a minimal web-socket server is initiated and a small dev client is injected on all your apps pages. This means that as soon as you make changes to any of you source files the page will automatically reload. If you only change a `.css` file the page will not be reloaded, instead the css will be replaced "in-flight".

By default the web socket will be setup to listen on `localhost` and port `3000`. You can configure this by passing flags to the CLI; `wp-bundler dev --host <host> --port <port>`.

## Asset types

`wp-bundler` can handle the same asset types as [`esbuild`](https://esbuild.github.io/content-types/) can. Outside of what's setup by default by `esbuild` it will also handle font files (`.ttf`, `.eot`, `.woff` and `.woff2`).

### Javascript and Typescript

Javascript and Typescript is mainly compiled for modern browsers. During development that's the only version emitted. But when building for production an extra version of all js is also emitted, a "nomodule" version which is compiled to work with older browsers. It uses [`swc`](https://swc.rs/) under the hood to make the compilation fast.

The "modern" bundle is loaded in a script tag with `type="module"` specified, and the version for older browsers are loaded with `nomodule` set on the script tag.

### CSS

Your css is "post processed" by [`postcss`](https://postcss.org/). `wp-bundler` uses [`postcss-preset-env`](https://preset-env.cssdb.org/) to compile the css to a version that is more friendly to older browsers. See `postcss-preset-env`'s documentation for details around which features are available for compilation.

#### CSS modules

CSS modules are supported out of the box. Name your css files with the `.module.css` extension and they will be treated as css modules. The class names will be globally unique and each class will be available as a named export.

```css
.button {
  background: rebeccapurple;
}
```

```js
import * as style from './button.module.css';
<button className={style.button}>Hello</button>;
```

You can read more about what is possible with CSS modules within the context of wp-bundler and esbuild by referencing the [esbuild documentation](https://esbuild.github.io/content-types/#local-css).

## Asset loader

As part of both the `dev` and `build` commands a special "asset loader" php class is created (you can configure its location by defining `assetLoader.path` in your `wp-bundler` config).

The file gets emitted with the most recent versions of you assets. These assets can then be loaded as part of the WordPress flow.

### Usage

If you are not using some kind of autoloader for your project you need to require the file to make the `AutoLoader` class available in your environment. Your theme's `functions.php` or plugins main entry point is probably a suitable file for this.

You also need to call the static `prepare` method on the class in order to setup some necessary action and filter hooks.

```php
require_once __DIR__ . '/AssetLoader.php';
\WPBundler\AssetLoader::prepare();

// If you are developing a plugin you need to explicitly pass your plugin's root folder and url like so:
\WPBundler\AssetLoader::prepare(\plugin_dir_path(__FILE__), \plugin_dir_url(__FILE__));
```

After that you should be able to use the `AssetLoader` class anywhere in your application code. The loader will take care of loading both javascript and css emitted by the bundler. All methods are static.

```php
// Enqueue the script as parth of the `wp_enqueue_scripts` action hook
\WPBundler\AssetLoader::enqueueAssets('app');

// Enqueue your assets as part of the Gutenberg block editor, using the `enqueue_block_editor_assets` action hook
\WPBundler\AssetLoader::enqueueEditorAssets('app');

// Hook into `init` action and register a block type together with its assets
\WPBundler\AssetLoader::enqueueBlockType('editor', 'my-block');

// Then there are methods which are not wrapped in "hooks". These are more
// similar to the `wp_register_script` or `wp_enqueue_script` et.al.
\WPBundler\AssetLoader::register('app');
\WPBundler\AssetLoader::enqueue('app');
\WPBundler\AssetLoader::registerBlockType('editor', 'my-block');
```

See the [`AssetLoader`](./assets/AssetLoader.php) implementation for more information about what the methods can do.

## External dependencies

`wp-bundler` will automatically recognize external modules that are already built into and distributed by WordPress. These dependencies will not be included in your bundle and instead automatically loaded as dependencies by the `AutoLoader`.

This means that as long as you use any of the built-in dependencies (`@wordpress/*`, `react`, `jquery` etc.) you don't have to specify them in the `$deps` array. Though if you specifiy other externals in your bundler config (`config.externals`) you need to register them with `wp_register_script` and specify them as dependencies of your asset (`AssetLoader::enqueueAsset('app' ['dependency-handle']);`).

The following dependencies are automatically detected and loaded by `wp-bundler`:

- React (`import React from 'react'`)
- ReactDOM (`import ReactDOM from 'react-dom'`)
- jQuery (`import $ from 'jquery'`)

_Note that accessing `window.$('.whatever')` is not recognized by `wp-bundler` and you therefore need to specify `jquery` as a dependency of you asset._

Outside of that all `@wordpress/*` packages are automatically identified by the bundler and excluded from the bundle, then enqueued by the `AssetLoader`. For example if you, somewhere in your source code, do `import api from '@wordpress/api-fetch'` the `AssetLoader` will automatically define `wp-api-fetch` as a dependency of the asset that depends on it.

## Translations

Translation support is one of the main reasons this project was created in the beginning. None of the other projects that I've found cares about translations, at all. And `wp-cli i18n make-pot` and `wp-cli i18n make-json` are very limited in what the can do. For example they can't extract translations from Typescript files or scripts created by a bundler.

`wp-bundler` uses ast processing to find all translations in your source code and then generate `jed` formatted translation files for all the scripts that needs it. The translations are automatically loaded by the `AssetLoader` when you register/enqueue an asset.

`wp-bundler` will look for calls to the `__`, `_x`, `_n` and `_nx` methods. And all the below calls will be recognized:

```js
import { __, _n as translate } from '@wordpress/i18n';

__('Foo', 'domain');
translate('Foo', 'Foos', 1, 'domain');
window.wp.i18n._x('Foo', 'context', 'domain');
wp.i18n._nx('Foo', 'Foos', 2, 'context', 'domain');
```

_Note that using `window.wp.i18n.{method}` will not recognize `wp-i18n` as a dependency of your script. In that case you need to specify it as a dependency when you register/enqueue the asset._

All translations found will also be emitted to a translations template file (`.pot`) of your choice. That means that every time you add a new translation a new entry will be created in your pot file, even in development mode.

The `.po` files, configured in `translations.pos`, will then be used to emit `jed` formatted json files that the WordPress i18n package can handle.

### PHP and Twig translations

The bundler will also look for, and extract, translations from your projects `.php` and `.twig` files. It will find all of these files in you project, but ignoring the `vendor` and `node_modules` folders. This means that using this package means you no longer need to use `wp-cli i18n make-pot/make-json` to extract and generate translations.

`.mo` files will also me compiled from all your `.po` files.

## Environment variables

You can define environment variables in a `.env` file located in the root of you project, right by you `package.json` file. `wp-bundler` will inject any env variable defined in those that starts with `WP_`.

- `WP_API_KEY` => injected
- `API_KEY` => not injected

Then in your application code you can access those by reading `process.env.WP_API_KEY` (or whatever the variable was called).

The variables defined in `.env` will not override any environment variables already set.

### Other injected variables

Except environment variable prefixed with `WP_` `wp-bundler` will also inject the following variables:

- `process.env.NODE_ENV`: `'production'` during build, `'development'` in watch mode
- `__DEV__`: `false` during build, `true` in watch mode
- `__PROD__`: `true` during build, `false` in watch mode

### Other `.env` files

Except the `.env` file you can use a few other `.env` files to inject variables from. The list below defines which files are read during which script. Files to the left have more priority than files to the right. Meaning that variables coming from a file to the left will override a variable coming from a file to the right.

- `wp-bundler build` (or `--mode prod`): `.env.production.local` > `.env.local` > `.env.production` > `.env`
- `wp-bundler dev` (or `--mode dev`): `.env.development.local` > `.env.local` > `.env.development` > `.env`

With this structure you could have a `.env` file tracked by `git` and then allow developers to override these defaults with their own `.env.local` files, which should not be checked into `git`. This is the same mechanism as e.g. [Next.js uses](https://nextjs.org/docs/basic-features/environment-variables#environment-variable-load-order).

## Other WordPress focused bundlers

The following projects might interest you if `wp-bundler` doesn't meet your requirements.

- [`wpack.io`](https://wpack.io/)
- [`presspack`](https://github.com/jaredpalmer/presspack))

## LICENSE

MIT
