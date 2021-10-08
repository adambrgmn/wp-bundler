# @fransvilhelm/wp-bundler

## 2.0.0

### Major Changes

- Drop tailwind support (by [@adambrgmn](https://github.com/adambrgmn) in
  [#18](https://github.com/adambrgmn/wp-bundler/pull/18))

  Running tailwind as part of the dev flow took to long. Tailwind needs to run outside of the wp-bundler context.

- Add proper dev server with reload on change (by [@adambrgmn](https://github.com/adambrgmn) in
  [#21](https://github.com/adambrgmn/wp-bundler/pull/21))

  This version includes a new dev server. The server is automatically started when running `wp-bundler --watch`.

  The server will listen for changes to your source files, including `.php` and `.twig` files. If a change is detected
  the page will be reloaded and the changes applied.

  If a change only affects `.css`-files the page will not be reloaded. Instead all your css will be "hot-reladed" on the
  page without requiring a refresh.

### Minor Changes

- Add env variable support similar to CRA (by [@adambrgmn](https://github.com/adambrgmn) in
  [#22](https://github.com/adambrgmn/wp-bundler/pull/22))
- Rewrite postcss plugin (by [@adambrgmn](https://github.com/adambrgmn) in
  [#17](https://github.com/adambrgmn/wp-bundler/pull/17))

### Patch Changes

- Fix broken translations (by [@adambrgmn](https://github.com/adambrgmn) in
  [#17](https://github.com/adambrgmn/wp-bundler/pull/17))
- Improve twig message extraction (by [@adambrgmn](https://github.com/adambrgmn) in
  [#20](https://github.com/adambrgmn/wp-bundler/pull/20))
- Fix translations extraction inconsistencies (by [@adambrgmn](https://github.com/adambrgmn) in
  [#15](https://github.com/adambrgmn/wp-bundler/pull/15))
- Remove metafile plugin (by [@adambrgmn](https://github.com/adambrgmn) in
  [#17](https://github.com/adambrgmn/wp-bundler/pull/17))
- Only run translations plugin on build (by [@adambrgmn](https://github.com/adambrgmn) in
  [#15](https://github.com/adambrgmn/wp-bundler/pull/15))
- Fix issue with extracting domains from \_n_noop (by [@adambrgmn](https://github.com/adambrgmn) in
  [#21](https://github.com/adambrgmn/wp-bundler/pull/21))
- Fix issues in error output (by [@adambrgmn](https://github.com/adambrgmn) in
  [#17](https://github.com/adambrgmn/wp-bundler/pull/17))

## 1.2.0

### Minor Changes

- Extract translations from style.css (by [@adambrgmn](https://github.com/adambrgmn) in
  [#14](https://github.com/adambrgmn/wp-bundler/pull/14))
- Extract translations from twig files (by [@adambrgmn](https://github.com/adambrgmn) in
  [#11](https://github.com/adambrgmn/wp-bundler/pull/11))
- Extract translator comments when extracting translations (by [@adambrgmn](https://github.com/adambrgmn) in
  [#10](https://github.com/adambrgmn/wp-bundler/pull/10))
- Extract translations from PHP files as part of the build step (by [@adambrgmn](https://github.com/adambrgmn) in
  [#10](https://github.com/adambrgmn/wp-bundler/pull/10))

### Patch Changes

- Ensure uniq references in po(t) files (by [@adambrgmn](https://github.com/adambrgmn) in
  [#8](https://github.com/adambrgmn/wp-bundler/pull/8))
- Fix writing out proper po file (by [@adambrgmn](https://github.com/adambrgmn) in
  [#14](https://github.com/adambrgmn/wp-bundler/pull/14))
- Emit proper translator comments (by [@adambrgmn](https://github.com/adambrgmn) in
  [#14](https://github.com/adambrgmn/wp-bundler/pull/14))
- Properly minify css after postcss (by [@adambrgmn](https://github.com/adambrgmn) in
  [#13](https://github.com/adambrgmn/wp-bundler/pull/13))
- Enable ignoring folders for message extraction (by [@adambrgmn](https://github.com/adambrgmn) in
  [#14](https://github.com/adambrgmn/wp-bundler/pull/14))
- Fix merging po and pot files (by [@adambrgmn](https://github.com/adambrgmn) in
  [#13](https://github.com/adambrgmn/wp-bundler/pull/13))

## 1.1.1

### Patch Changes

- Update po files with translations as well (by [@adambrgmn](https://github.com/adambrgmn) in
  [#6](https://github.com/adambrgmn/wp-bundler/pull/6))
- Fix issue where scripts loaded in the block editor weren't loaded as modules (by
  [@adambrgmn](https://github.com/adambrgmn) in [#6](https://github.com/adambrgmn/wp-bundler/pull/6))
- allow defining css dependencies on scripts (by [@adambrgmn](https://github.com/adambrgmn) in
  [#6](https://github.com/adambrgmn/wp-bundler/pull/6))
- Add lodash as as we built-in global (by [@adambrgmn](https://github.com/adambrgmn) in
  [#6](https://github.com/adambrgmn/wp-bundler/pull/6))
- Fix purging tailwind classes (by [@adambrgmn](https://github.com/adambrgmn) in
  [#6](https://github.com/adambrgmn/wp-bundler/pull/6))
- Skip marking node globals as external (by [@adambrgmn](https://github.com/adambrgmn) in
  [#6](https://github.com/adambrgmn/wp-bundler/pull/6))

  Doing this hides errors that should otherwise be surfaced. Because marking them as just "external" forces the browser
  to try and import these libraries (`import fs from 'fs'`) in the browser. Which ofcourse blows up. Now we instead rely
  on esbuild to report errors when our scripts (or their dependencies) tries to import any built-in node modules.

## 1.1.0

### Minor Changes

- Fix dependency issues (by [@adambrgmn](https://github.com/adambrgmn) in
  [#4](https://github.com/adambrgmn/wp-bundler/pull/4))

## 1.0.0

### Major Changes

- Initial implementation (by [@adambrgmn](https://github.com/adambrgmn) in
  [#1](https://github.com/adambrgmn/wp-bundler/pull/1))

  This is the initial release of the `wp-bundler` cli.
