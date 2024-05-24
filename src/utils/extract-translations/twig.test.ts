import { expect, it } from 'vitest';

import type { TranslationMessage } from './index.js';
import { extractTranslations } from './twig.js';

it('extracts translations from php files', () => {
  let source = `
    {{ __('Translation 0', 'wp-bundler') }}
    {{ _e('Translation 1', 'wp-bundler') }}
    {{ esc_attr__('Translation 2', 'wp-bundler') }}
    {{ esc_attr_e('Translation 3', 'wp-bundler') }}
    {{ esc_html__('Translation 4', 'wp-bundler') }}
    {{ esc_html_e('Translation 5', 'wp-bundler') }}

    {{ _x('Translation 6', 'context', 'wp-bundler') }}
    {{ _ex('Translation 7', 'context', 'wp-bundler') }}
    {{ esc_attr_x('Translation 8', 'context', 'wp-bundler') }}
    {{ esc_html_x('Translation 9', 'context', 'wp-bundler') }}

    {{ _n('Translation 10', 'Translations 10', 1, 'wp-bundler') }}
    {{ _n_noop('Translation 11', 'Translations 11', 'wp-bundler') }}
    {{ _nx('Translation 12', 'Translations 12', 1, 'context', 'wp-bundler') }}
    {{ _nx_noop('Translation 13', 'Translations 13', 'context', 'wp-bundler') }}
  `;

  let result = removeLocation(extractTranslations(source, 'test.twig'));

  expect(result).toHaveLength(14);

  expect(result[0]).toEqual({ text: 'Translation 0', domain: 'wp-bundler' });
  expect(result[1]).toEqual({ text: 'Translation 1', domain: 'wp-bundler' });
  expect(result[2]).toEqual({ text: 'Translation 2', domain: 'wp-bundler' });
  expect(result[3]).toEqual({ text: 'Translation 3', domain: 'wp-bundler' });
  expect(result[4]).toEqual({ text: 'Translation 4', domain: 'wp-bundler' });
  expect(result[5]).toEqual({ text: 'Translation 5', domain: 'wp-bundler' });

  expect(result[6]).toEqual({ text: 'Translation 6', context: 'context', domain: 'wp-bundler' });
  expect(result[7]).toEqual({ text: 'Translation 7', context: 'context', domain: 'wp-bundler' });
  expect(result[8]).toEqual({ text: 'Translation 8', context: 'context', domain: 'wp-bundler' });
  expect(result[9]).toEqual({ text: 'Translation 9', context: 'context', domain: 'wp-bundler' });

  expect(result[10]).toEqual({ single: 'Translation 10', plural: 'Translations 10', domain: 'wp-bundler' });
  expect(result[11]).toEqual({ single: 'Translation 11', plural: 'Translations 11', domain: 'wp-bundler' });
  expect(result[12]).toEqual({
    single: 'Translation 12',
    plural: 'Translations 12',
    context: 'context',
    domain: 'wp-bundler',
  });
  expect(result[13]).toEqual({
    single: 'Translation 13',
    plural: 'Translations 13',
    context: 'context',
    domain: 'wp-bundler',
  });
});

it('extracts translations that is part of set calls', () => {
  let source = `
    {% set form_id = __('Translation', 'wp-bundler') %}
  `;

  let result = extractTranslations(source, 'test.twig');
  expect(removeLocation(result)).toEqual([{ text: 'Translation', domain: 'wp-bundler' }]);
});

it('extracts translations from special cases', () => {
  let source = `
    {{ otherFunction(__('Translation 1', 'wp-bundler')) }}
    {{ other.function(__('Translation 2', 'wp-bundler')) }}

    {% for day in week %}
      {{ _x('Translation 3', 'context', 'wp-bundler') }}
    {% endfor %}

    {% set test = sprintf(_n('Translation 4 single', 'Translation 4 plural', getNum('2'), 'wp-bundler')) %}
  `;

  let result = extractTranslations(source, 'test.twig');
  expect(removeLocation(result)).toEqual([
    { text: 'Translation 1', domain: 'wp-bundler' },
    { text: 'Translation 2', domain: 'wp-bundler' },
    { text: 'Translation 3', context: 'context', domain: 'wp-bundler' },
    { single: 'Translation 4 single', plural: 'Translation 4 plural', domain: 'wp-bundler' },
  ]);
});

it('extracts translations within blocks', () => {
  let source = `
    {% block title %}
      {{ __('Translation', 'wp-bundler') }}</p>
    {% endblock %}
  `;

  let result = extractTranslations(source, 'test.twig');
  expect(removeLocation(result)).toEqual([{ text: 'Translation', domain: 'wp-bundler' }]);
});

it('extracts translations within extends', () => {
  let source = `
    {% block title %}
      {{ __('Translation', 'wp-bundler') }}</p>
    {% endblock %}
  `;

  let result = extractTranslations(source, 'test.twig');
  expect(removeLocation(result)).toEqual([{ text: 'Translation', domain: 'wp-bundler' }]);
});

it('extracts translations within macros', () => {
  let source = `
    {% macro title() %}
      {{ __('Translation', 'wp-bundler') }}</p>
    {% endmacro %}
  `;

  let result = extractTranslations(source, 'test.twig');
  expect(removeLocation(result)).toEqual([{ text: 'Translation', domain: 'wp-bundler' }]);
});

it('extracts translations from multiline definitions', () => {
  let source = `
      {{ __(
        'Translation',
        'wp-bundler'
        ) }}</p>
  `;

  let result = extractTranslations(source, 'test.twig');
  expect(removeLocation(result)).toEqual([{ text: 'Translation', domain: 'wp-bundler' }]);
});

it.skip('extracts translations from language extensions', () => {
  let source = `
    {% switch input.type %}
      {% case "checkbox" %}
        {{ __('Translation', 'wp-bundler') }}</p>
    {% endswitch %}
  `;

  let result = extractTranslations(source, 'test.twig');
  expect(removeLocation(result)).toEqual([{ text: 'Translation', domain: 'wp-bundler' }]);
});

it('extracts the correct location for translations', () => {
  let source = `
    <p>{{ __('Translation', 'wp-bundler') }}</p>
  `;

  let result = extractTranslations(source, 'test.twig');
  expect(result.at(0)?.location).toEqual({
    file: 'test.twig',
    namespace: '',
    line: 2, // 1-based
    column: 10, // 0-based, in bytes
    length: 0, // in bytes
    lineText: '',
    suggestion: '',
  });
});

it('can extract translator comments from twig', () => {
  let source = `
    {# translators: a translation #}
    <p>{{ __('Translation 0', 'wp-bundler') }}</p>
    {# not a translators string #}
    <p>{{ __('Translation 1', 'wp-bundler') }}</p>
  `;

  let result = extractTranslations(source, 'test.twig');
  expect(removeLocation(result)).toEqual([
    { text: 'Translation 0', domain: 'wp-bundler', translators: 'translators: a translation' },
    { text: 'Translation 1', domain: 'wp-bundler', translators: undefined },
  ]);
});

it('will not break if domain is not defined', () => {
  let source = `
    <p>{{ __('Translation without domain') }}</p>
  `;

  let result = extractTranslations(source, 'test.twig');
  expect(removeLocation(result)).toEqual([{ text: 'Translation without domain', domain: undefined }]);
});

function removeLocation(messages: TranslationMessage[]): Omit<TranslationMessage, 'location'>[] {
  return messages.map(({ location, ...t }) => t);
}
