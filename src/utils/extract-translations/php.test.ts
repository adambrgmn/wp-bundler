import { expect, it } from 'vitest';

import { TranslationMessage } from '.';
import { extractTranslations } from './php';

it('extracts translations from php files', () => {
  let source = `
    <?php

    __('Translation', 'wp-bundler');
    _x('Translation', 'context', 'wp-bundler');
    _n('Single', 'Plural', 2, 'wp-bundler');
    _nx('Single', 'Plural', 2, 'context', 'wp-bundler');
    _n_noop('Single', 'Plural', 'wp-bundler');
    _nx_noop('Single', 'Plural', 'context', 'wp-bundler');
  `.trim();

  let result = extractTranslations(source, 'test.php');
  expect(removeLocation(result)).toEqual([
    { text: 'Translation', domain: 'wp-bundler' },
    { text: 'Translation', context: 'context', domain: 'wp-bundler' },
    { single: 'Single', plural: 'Plural', domain: 'wp-bundler' },
    { single: 'Single', plural: 'Plural', context: 'context', domain: 'wp-bundler' },
    { single: 'Single', plural: 'Plural', domain: 'wp-bundler' },
    { single: 'Single', plural: 'Plural', context: 'context', domain: 'wp-bundler' },
  ]);
});

it('extracts translations from within functions', () => {
  let source = `
    <?php
    function test() {
      return __('Translation', 'wp-bundler');
    }
  `.trim();

  let result = extractTranslations(source, 'test.php');
  expect(removeLocation(result)).toEqual([{ text: 'Translation', domain: 'wp-bundler' }]);
});

it('extracts translations from within classes', () => {
  let source = `
    <?php
    class Whatever extends Whoever {
      public function test() {
        $var = __('Translation', 'wp-bundler');
        return $var;
      }
    }
  `.trim();

  let result = extractTranslations(source, 'test.php');
  expect(removeLocation(result)).toEqual([{ text: 'Translation', domain: 'wp-bundler' }]);
});

it('extracts translations from within loops', () => {
  let source = `
    <?php
    $var = [];
    foreach ($var as $i) {
      __('Translation', 'wp-bundler');
    }
  `.trim();

  let result = extractTranslations(source, 'test.php');
  expect(removeLocation(result)).toEqual([{ text: 'Translation', domain: 'wp-bundler' }]);
});

it('extracts translations defined as part of a function argument', () => {
  let source = `
    <?php
    sprintf(__('Translation', 'wp-bundler'), '');
  `.trim();

  let result = extractTranslations(source, 'test.php');
  expect(removeLocation(result)).toEqual([{ text: 'Translation', domain: 'wp-bundler' }]);
});

it('extracts translations defined as part of an array', () => {
  let source = `
    <?php
    $var = [
      't' => __('Translation 1', 'wp-bundler')
    ];

    $var2 = [__('Translation 2', 'wp-bundler')];
  `.trim();

  let result = extractTranslations(source, 'test.php');
  expect(removeLocation(result)).toEqual([
    { text: 'Translation 1', domain: 'wp-bundler' },
    { text: 'Translation 2', domain: 'wp-bundler' },
  ]);
});

it('extracts translations with leading slashes (e.g. \\__(...))', () => {
  let source = `
    <?php
    \\__('Translation', 'wp-bundler');
  `.trim();

  let result = extractTranslations(source, 'test.php');
  expect(removeLocation(result)).toEqual([{ text: 'Translation', domain: 'wp-bundler' }]);
});

it('extracts the correct location for translations', () => {
  let source = `
    <?php
    $var = [];
    foreach ($var as $i) {
      __('Translation', 'wp-bundler');
    }
  `.trim();

  let result = extractTranslations(source, 'test.php');
  expect(result[0].location).toEqual({
    file: 'test.php',
    namespace: '',
    line: 4, // 1-based
    column: 6, // 0-based, in bytes
    length: 0, // in bytes
    lineText: '',
    suggestion: '',
  });
});

it('extracts translator comments', () => {
  let source = `
    <?php
    // translators: a comment 1
    __('Translation 1', 'wp-bundler');

    /* translators: a comment 2 */
    $variable = __('Translation 3', 'wp-bundler');

    function translate() {
      /**
       * translators: a comment 3
       */
      __('Translation 3', 'wp-bundler');
    }

    // translators: a comment 4
    sprintf(__('Translation 4', 'wp-bundler'), '');
  `;

  let result = extractTranslations(source, 'test.php');
  expect(result[0].translators).toEqual('translators: a comment 1');
  expect(result[1].translators).toEqual('translators: a comment 2');
  expect(result[2].translators).toEqual('translators: a comment 3');
  expect(result[3]?.translators).toEqual('translators: a comment 4');
});

function removeLocation(messages: TranslationMessage[]) {
  return messages.map(({ location, ...t }) => t);
}
