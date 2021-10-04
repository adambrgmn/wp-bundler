# @fransvilhelm/wp-bundler

## 1.2.0-next.1

### Patch Changes

- Properly minify css after postcss (by [@adambrgmn](https://github.com/adambrgmn) in
  [#13](https://github.com/adambrgmn/wp-bundler/pull/13))
- Fix merging po and pot files (by [@adambrgmn](https://github.com/adambrgmn) in
  [#13](https://github.com/adambrgmn/wp-bundler/pull/13))

## 1.2.0-next.0

### Minor Changes

- Extract translations from twig files (by [@adambrgmn](https://github.com/adambrgmn) in
  [#11](https://github.com/adambrgmn/wp-bundler/pull/11))
- Extract translator comments when extracting translations (by [@adambrgmn](https://github.com/adambrgmn) in
  [#10](https://github.com/adambrgmn/wp-bundler/pull/10))
- Extract translations from PHP files as part of the build step (by [@adambrgmn](https://github.com/adambrgmn) in
  [#10](https://github.com/adambrgmn/wp-bundler/pull/10))

### Patch Changes

- Ensure uniq references in po(t) files (by [@adambrgmn](https://github.com/adambrgmn) in
  [#8](https://github.com/adambrgmn/wp-bundler/pull/8))

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
