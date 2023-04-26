# @fransvilhelm/wp-bundler

## 4.0.2

### Patch Changes

- Use correct ReactDOM global (by [@adambrgmn](https://github.com/adambrgmn) in [#75](https://github.com/adambrgmn/wp-bundler/pull/75))

## 4.0.1

### Patch Changes

- Remove postinstall script (by [@adambrgmn](https://github.com/adambrgmn) in [#73](https://github.com/adambrgmn/wp-bundler/pull/73))

  The postinstall script was a stupid idea from the beginning, causing issues for `yarn` projects.

  We're better off without it.

## 4.0.0

### Major Changes

- Make project esm only (by [@adambrgmn](https://github.com/adambrgmn) in [#66](https://github.com/adambrgmn/wp-bundler/pull/66))

  This project is now esm only. Generally it shouldn't affect you that much. But if you plan on building something on top of wp-bundler, using the exposed interfaces you need to be aware of this fact.

- Remove ability to call wp-bundler without sub commands (by [@adambrgmn](https://github.com/adambrgmn) in [#69](https://github.com/adambrgmn/wp-bundler/pull/69))

  Previously we allowed calling `wp-bundler` without `dev` or `build` sub commands, like it was from v1. This release removes that ability. From now on you must call `wp-bundler dev` or `wp-bundler build`.

### Minor Changes

- Move away from multibundler setup (by [@adambrgmn](https://github.com/adambrgmn) in [#69](https://github.com/adambrgmn/wp-bundler/pull/69))

  Previously we initiated two separate esbuild process to build the modern and legacy outputs. This meant we had no way to output a good asset loader witouth waiting for both of the outputs to be done and merge them.

  With this approach the legacy output is moving into the main process again. Something that will speed up and make out lives much easier in the future.

## 3.0.1

### Patch Changes

- Update documentation for v3 (by [@adambrgmn](https://github.com/adambrgmn) in [#58](https://github.com/adambrgmn/wp-bundler/pull/58))

## 3.0.0

### Major Changes

- Require minimum node version 14 (by [@adambrgmn](https://github.com/adambrgmn) in [#45](https://github.com/adambrgmn/wp-bundler/pull/45))

  This was the requirement before as well, though it was not clearly stated. With this release it is more clearly stated that 14.8 is the least requirement.

- Rework cli output (by [@adambrgmn](https://github.com/adambrgmn) in [#41](https://github.com/adambrgmn/wp-bundler/pull/41))

  Previoulsy the cli output was rendered with `ink` and `react`. That was effective and made it easy to make an interactive cli. But I've realized that this is not an interactive cli. I want `wp-bundler` to stay out of your way.

  This rework means that the cli is no longer rendered with ink. Instead the output is regular `console.log`'s. This also has the benefit of working in non interactive cli environments as well.

- Introduce build & dev sub commands (by [@adambrgmn](https://github.com/adambrgmn) in [#35](https://github.com/adambrgmn/wp-bundler/pull/35))

  Previously `wp-bundler` worked as a single command, without nothing but flags as the arguments.

  But to cater for future improvements I've choosen to split the command into sub commands – for now `wp-bundler build` for production and `wp-bundler dev` for development.

  The old behaviour is still around, but is marked as deprecated and is not recommended for new projects. It will be removed in the next major release.

### Minor Changes

- Improve handling of react (by [@adambrgmn](https://github.com/adambrgmn) in [#56](https://github.com/adambrgmn/wp-bundler/pull/56))

  Previously we relied on React being imported every time you wanted to use jsx (`import React from 'react';`). But with this change the jsx factory is injected when needed and you no longer have to import react.

  It also improves how the jsx factory is handled. Previously it used `React.createElement`. But now it instead using `createElement` from `'@wordpress/element'`.

- Add support for plugins (by [@adambrgmn](https://github.com/adambrgmn) in [#48](https://github.com/adambrgmn/wp-bundler/pull/48))

  This builder wasn't supported by plugins before since the generated `AssetLoader` included some functions tied to specific themes. But with this relase the bundler also supports plugins.

  The only thing you need to do is pass root directory and url to the `AssetLoader::prepare` call in you main entry file:

  ```php
  require_once __DIR__ . '/dist/AssetLoader.php';

  WPBundler\AssetLoader::prepare(\plugin_dir_path(__FILE__), \plugin_dir_url(__FILE__));
  WPBundler\AssetLoader::enqueueAssets('main');
  ```

### Patch Changes

- Fix bug where css transforms are not applied (by [@adambrgmn](https://github.com/adambrgmn) in [#45](https://github.com/adambrgmn/wp-bundler/pull/45))
- Skip emitting confusing nomodule css (by [@adambrgmn](https://github.com/adambrgmn) in [#46](https://github.com/adambrgmn/wp-bundler/pull/46))
- Add improved examples (by [@adambrgmn](https://github.com/adambrgmn) in [#49](https://github.com/adambrgmn/wp-bundler/pull/49))

  This release also adds improved examples. The previous example ran in a custom environment without actually using WordPress. These new examples makes use of `@wordpress/env` to spin up a quick WordPress environment.

- Bundle @wordpress/icons instead of adding it as dependency (by [@adambrgmn](https://github.com/adambrgmn) in [#55](https://github.com/adambrgmn/wp-bundler/pull/55))

  @wordpress/icons is treated as an internal packages and is not exposed on `window.wp` as the others. Instead this package should be bundled with the projects source. See #54 for context.

- Surface errors outside esbuild pipeline (by [@adambrgmn](https://github.com/adambrgmn) in [#47](https://github.com/adambrgmn/wp-bundler/pull/47))

## 2.1.1

### Patch Changes

- Remove unused comment when translation is used again (by [@adambrgmn](https://github.com/adambrgmn) in [#34](https://github.com/adambrgmn/wp-bundler/pull/34))
- Fix default empty string for plural translations (by [@adambrgmn](https://github.com/adambrgmn) in [#31](https://github.com/adambrgmn/wp-bundler/pull/31))

## 2.1.0

### Minor Changes

- Load dev script in admin area (by [@adambrgmn](https://github.com/adambrgmn) in [#27](https://github.com/adambrgmn/wp-bundler/pull/27))
- Add ability to configure wp-bundler with .wp-bundlerrc or wp-bundler.config.json (by [@adambrgmn](https://github.com/adambrgmn) in [#24](https://github.com/adambrgmn/wp-bundler/pull/24))

## 2.0.0

### Major Changes

- Drop tailwind support (by [@adambrgmn](https://github.com/adambrgmn) in [#18](https://github.com/adambrgmn/wp-bundler/pull/18))

  Running tailwind as part of the dev flow took to long. Tailwind needs to run outside of the wp-bundler context.

- Add proper dev server with reload on change (by [@adambrgmn](https://github.com/adambrgmn) in [#21](https://github.com/adambrgmn/wp-bundler/pull/21))

  This version includes a new dev server. The server is automatically started when running `wp-bundler --watch`.

  The server will listen for changes to your source files, including `.php` and `.twig` files. If a change is detected the page will be reloaded and the changes applied.

  If a change only affects `.css`-files the page will not be reloaded. Instead all your css will be "hot-reladed" on the page without requiring a refresh.

### Minor Changes

- Add env variable support similar to CRA (by [@adambrgmn](https://github.com/adambrgmn) in [#22](https://github.com/adambrgmn/wp-bundler/pull/22))
- Rewrite postcss plugin (by [@adambrgmn](https://github.com/adambrgmn) in [#17](https://github.com/adambrgmn/wp-bundler/pull/17))

### Patch Changes

- Fix broken translations (by [@adambrgmn](https://github.com/adambrgmn) in [#17](https://github.com/adambrgmn/wp-bundler/pull/17))
- Improve twig message extraction (by [@adambrgmn](https://github.com/adambrgmn) in [#20](https://github.com/adambrgmn/wp-bundler/pull/20))
- Fix translations extraction inconsistencies (by [@adambrgmn](https://github.com/adambrgmn) in [#15](https://github.com/adambrgmn/wp-bundler/pull/15))
- Remove metafile plugin (by [@adambrgmn](https://github.com/adambrgmn) in [#17](https://github.com/adambrgmn/wp-bundler/pull/17))
- Only run translations plugin on build (by [@adambrgmn](https://github.com/adambrgmn) in [#15](https://github.com/adambrgmn/wp-bundler/pull/15))
- Fix issue with extracting domains from \_n_noop (by [@adambrgmn](https://github.com/adambrgmn) in [#21](https://github.com/adambrgmn/wp-bundler/pull/21))
- Fix issues in error output (by [@adambrgmn](https://github.com/adambrgmn) in [#17](https://github.com/adambrgmn/wp-bundler/pull/17))

## 1.2.0

### Minor Changes

- Extract translations from style.css (by [@adambrgmn](https://github.com/adambrgmn) in [#14](https://github.com/adambrgmn/wp-bundler/pull/14))
- Extract translations from twig files (by [@adambrgmn](https://github.com/adambrgmn) in [#11](https://github.com/adambrgmn/wp-bundler/pull/11))
- Extract translator comments when extracting translations (by [@adambrgmn](https://github.com/adambrgmn) in [#10](https://github.com/adambrgmn/wp-bundler/pull/10))
- Extract translations from PHP files as part of the build step (by [@adambrgmn](https://github.com/adambrgmn) in [#10](https://github.com/adambrgmn/wp-bundler/pull/10))

### Patch Changes

- Ensure uniq references in po(t) files (by [@adambrgmn](https://github.com/adambrgmn) in [#8](https://github.com/adambrgmn/wp-bundler/pull/8))
- Fix writing out proper po file (by [@adambrgmn](https://github.com/adambrgmn) in [#14](https://github.com/adambrgmn/wp-bundler/pull/14))
- Emit proper translator comments (by [@adambrgmn](https://github.com/adambrgmn) in [#14](https://github.com/adambrgmn/wp-bundler/pull/14))
- Properly minify css after postcss (by [@adambrgmn](https://github.com/adambrgmn) in [#13](https://github.com/adambrgmn/wp-bundler/pull/13))
- Enable ignoring folders for message extraction (by [@adambrgmn](https://github.com/adambrgmn) in [#14](https://github.com/adambrgmn/wp-bundler/pull/14))
- Fix merging po and pot files (by [@adambrgmn](https://github.com/adambrgmn) in [#13](https://github.com/adambrgmn/wp-bundler/pull/13))

## 1.1.1

### Patch Changes

- Update po files with translations as well (by [@adambrgmn](https://github.com/adambrgmn) in [#6](https://github.com/adambrgmn/wp-bundler/pull/6))
- Fix issue where scripts loaded in the block editor weren't loaded as modules (by [@adambrgmn](https://github.com/adambrgmn) in [#6](https://github.com/adambrgmn/wp-bundler/pull/6))
- allow defining css dependencies on scripts (by [@adambrgmn](https://github.com/adambrgmn) in [#6](https://github.com/adambrgmn/wp-bundler/pull/6))
- Add lodash as as we built-in global (by [@adambrgmn](https://github.com/adambrgmn) in [#6](https://github.com/adambrgmn/wp-bundler/pull/6))
- Fix purging tailwind classes (by [@adambrgmn](https://github.com/adambrgmn) in [#6](https://github.com/adambrgmn/wp-bundler/pull/6))
- Skip marking node globals as external (by [@adambrgmn](https://github.com/adambrgmn) in [#6](https://github.com/adambrgmn/wp-bundler/pull/6))

  Doing this hides errors that should otherwise be surfaced. Because marking them as just "external" forces the browser to try and import these libraries (`import fs from 'node:fs'`) in the browser. Which of course blows up. Now we instead rely on esbuild to report errors when our scripts (or their dependencies) tries to import any built-in node modules.

## 1.1.0

### Minor Changes

- Fix dependency issues (by [@adambrgmn](https://github.com/adambrgmn) in [#4](https://github.com/adambrgmn/wp-bundler/pull/4))

## 1.0.0

### Major Changes

- Initial implementation (by [@adambrgmn](https://github.com/adambrgmn) in [#1](https://github.com/adambrgmn/wp-bundler/pull/1))

  This is the initial release of the `wp-bundler` cli.
