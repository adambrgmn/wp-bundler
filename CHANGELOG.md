# @fransvilhelm/wp-bundler

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
