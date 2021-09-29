# WP Bundler

WP Bundler is a minimal and fast bundler for your WordPress front end assets. It is a "thin" wrapper around
[`esbuild`](https://esbuild.github.io/) with built-in support for translations. It handles all of your front end assets
including Javascript (with Typescript and React support), CSS (with Tailwind support) and other static assets imported
in these, e.g. images and fonts.

It will output modern Javascript for modern browsers as well as a "legacy" version of your scripts for older browsers
meaning that you will not send unneccessary content to modern browsers, while keeping the same functionality for older
browsers as well.

- [Installation](#installation)
- [Configuration](#configuration)
  - [`BundlerConfig.entryPoints` (required)](#bundlerconfigentrypoints-required)
  - [`BundlerConfig.outdir` (optional)](#bundlerconfigoutdir-optional)
  - [`BundlerConfig.sourcemap` (optional)](#bundlerconfigsourcemap-optional)
  - [`BundlerConfig.externals` (optional)](#bundlerconfigexternals-optional)
  - [`BundlerConfig.assetLoader` (optional)](#bundlerconfigassetloader-optional)
  - [`BundlerConfig.translations` (optional)](#bundlerconfigtranslations-optional)
- [Asset types](#asset-types)
  - [Javascript and Typescript](#javascript-and-typescript)
  - [CSS](#css)
- [Asset loader](#asset-loader)
  - [Usage](#usage)
- [External dependencies](#external-dependencies)
- [Translations](#translations)
- [Other WordPress focused bundlers](#other-wordpress-focused-bundlers)
- [Roadmap](#roadmap)
- [LICENSE](#license)

## Installation

Install the bundler locally as a dependency of you theme.

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

## Configuration

All configuration related to `wp-bundler` resides in your projects `package.json`, under the key `wp-bundler`. Below is
an example configuration with all available configuration options used:

```json
{
  "wp-bundler": {
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
}
```

The app uses schema validation logic to validate the configuration. The actual schema can be found in
[`./src/schema.ts`](./src/schema.ts).

### `BundlerConfig.entryPoints` (required)

- **Type:** `Record<string, string>`

`entryPoints` is used to tell the bundler which source files we care about. It should be an object with string values.
The keys (`app` and `admin`) in the above example can later be used to load the assets with the
[`AssetLoader`](#asset-loader).

The values should point to source files, most often it is `.js` (or `.ts`) files, but it can also be `.css` files. The
files will be bundled by `esbuild` and placed in the output directory (same directory as your `package.json`).

The paths should be referenced as relative to your projects root directory.

You don't have to specify one entry point for css and one for js if they are tightly coupled. Instead you can import the
css from your js source (`import './app.css'`).

### `BundlerConfig.outdir` (optional)

- **Type:** `string`
- **Default:** `'dist'`

`outdir` is the directory in which to put your assets. It should be referenced as relative to your projects root
directory (same directory as your `package.json`).

### `BundlerConfig.sourcemap` (optional)

- **Type:** `boolean`
- **Default:** `undefined`

Tell the bundler to output sourcemaps together with the bundled output. This option is optional and defaults to `true`
when you run `wp-bundler dev` and `false` when you run `wp-bundler build`.

### `BundlerConfig.externals` (optional)

- **Type:** `Record<string, string>`
- **Default:** `undefined`

If you are loading some libraries from e.g. a cdn or in some other fashion you can tell `wp-bundler` to ignore those
libraries and instead "import" them from the `window` object. The key should be the name of the dependency and the value
should be the key used to access it from `window`.

**Example:** Given the following config: `{ "externals": { "lodash": "_" } }` the library will skip bundling `lodash`
and instead access it from `window._`.

Built-in dependencies, e.g. jQuery, React and WordPress libraries are [handled automatically](#external-dependencies).

### `BundlerConfig.assetLoader` (optional)

- **Type:** `{ path?: string; namespace?: string }`
- **Default:** `{ path: './AssetLoader.php', namespace: 'WPBundler' }`

The `AssetLoader` is a php file that is emitted as part of the `build` and `dev` scripts. It can be used to load assets
as part of the WordPress workflow. With these options you can specify the location of the emitted `AssetLoader` and also
which namespace should be used. [Read more](#asset-loader).

### `BundlerConfig.translations` (optional)

- **Types:** `{ domain: string; pot: string; pos?: string[] }`
- **Default:** `undefined`

Configure if translations are enabled and if so where translations should live and how to handle them.
[Read more](#translations).

## Asset types

`wp-bundler` can handle the same asset types as [`esbuild`](https://esbuild.github.io/content-types/) can. Outside of
what's setup by default by `esbuild` it will also handle font files (`.ttf`, `.eot`, `.woff` and `.woff2`).

### Javascript and Typescript

Javascript and Typescript is mainly compiled for modern browsers. During development that's the only version emitted.
But when building for production an extra version of all js is also emitted, a "nomodule" version which is compiled to
work with older browsers. It uses [`swc`](https://swc.rs/) under the hood to make the compilation fast.

The "modern" bundle is loaded in a script tag with `type="module"` specified, and the version for older browsers are
loaded with `nomodule` set on the script tag.

### CSS

Your css is "post processed" by [`postcss`](https://postcss.org/). `wp-bundler` uses
[`postcss-preset-env`](https://preset-env.cssdb.org/) to compile the css to a version that is more friendly to older
browsers. See `postcss-preset-env`'s documentation for details around which features available for compilation.

#### Tailwindcss

`wp-bundler` also has built-in support for [`tailwindcss`](https://tailwindcss.com/). If the bundler finds a
`tailwinds.config.js` within your projects root directory the plugin will be enabled.

## Asset loader

As part of both the `dev` and `build` commands a special "asset loader" php class is created (you can configure its
location by defining `assetLoader.path` in your `wp-bundler` config).

The file gets emitted with the most recent versions of you assets. These assets can then be loaded as part of the
WordPress flow.

### Usage

If you are not using some kind of autoloader for your project you need to require the file to make the `AutoLoader`
class available in your environment. Your theme's `functions.php` is probably a suitable file for this.

You also need to call the static `prepare` method on the class in order to setup some necessary action and filter hooks.

```php
require_once __DIR__ . '/AssetLoader.php';
\WPBundler\AssetLoader::prepare();
```

After that you should be able to use the `AssetLoader` class anywhere in your application code. The loader will take
care of loading both javascript and css emitted by the bundler. All methods are static, no need to call
`new AssetLoader()`.

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

`wp-bundler` will automatically recognize external modules that are already built into and distributed by WordPress.
These dependencies will not be included in your bundle and instead automatically loaded as dependencies by the
`AutoLoader`.

This means that as long as you use any of the built-in dependencies (`@wordpress/*`, `react`, `jquery` etc.) you don't
have to specify them in the `$deps` array. Though if you specifiy other externals in your bundler config
(`config.externals`) you need to register them with `wp_register_script` and specify them as dependencies of your asset
(`AssetLoader::enqueueAsset('app' ['dependency-handle']);`).

The following dependencies are automatically detected and loaded by `wp-bundler`:

- React (`import React from 'react'`)
- ReactDOM (`import ReactDOM from 'react-dom'`)
- jQuery (`import $ from 'jquery'`)

_Note that accessing `window.$('.whatever')` is not recognized by `wp-bundler` and you therefore need to specify
`jquery` as a dependency of you asset._

Outside of that all `@wordpress/*` packages are automatically identified by the bundler and excluded from the bundle,
then enqueued by the `AssetLoader`. For example if you, somewhere in your source code, do
`import api from '@wordpress/api-fetch'` the `AssetLoader` will automatically define `wp-api-fetch` as a dependency of
the asset that depends on it.

## Translations

Translation support is one of the main reasons this project was created in the beginning. None of the other projects
that I've found cares about translations, at all. And `wp-cli i18n make-pot` and `wp-cli i18n make-json` are very
limited in what the can do. For example they can't extract translations from Typescript files or scripts created by a
bundler.

`wp-bundler` uses ast processing to find all translations in your source code and then generate `jed` formatted
translation files for all the scripts that needs it. The translations are automatically loaded by the `AssetLoader` when
you register/enqueue an asset.

`wp-bundler` will look for calls to the `__`, `_x`, `_n` and `_nx` methods. And all the below calls will be recognized:

```js
import { __, _n as translate } from '@wordpress/i18n';

__('Foo', 'domain');
translate('Foo', 'Foos', 1, 'domain');
window.wp.i18n._x('Foo', 'context', 'domain');
wp.i18n._nx('Foo', 'Foos', 2, 'context', 'domain');
```

_Note that using `window.wp.i18n.{method}` will not recognize `wp-i18n` as a dependency of your script. In that case you
need to specify it as a dependency when you register/enqueue the asset._

All translations found will also be emitted to a translations template file (`.pot`) of your choice. That means that
every time you add a new translation a new entry will be created in your pot file, even in development mode.

The `.po` files, configured in `translations.pos`, will then be used to emit `jed` formatted json files that the
WordPress i18n package can handle. Changes to these files will also result in a rebuild.

## Other WordPress focused bundlers

The following projects might interest you if `wp-bundler` doesn't meet your requirements.

- [`wpack.io`](https://wpack.io/)
- [`presspack`](https://github.com/jaredpalmer/presspack)

## Roadmap

Development of this module is still in a very early stage. It covers most of the basic needs and is used by its creator
in a rather large production environment. But there are still things that can be improved.

Below are a few things that migth come in the future.

- [ ] Support for other config files (e.g. `.wpbundlerrc` or `wp-bundler.config.json`).
- [ ] Built in browser refresh on successfull rebuilds.
- [ ] Automatically detect and enqueue all externals specified in configuration.
- [ ] Show warnings for missing translations.

## LICENSE

MIT
