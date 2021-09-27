import { extractTranslations } from './extract-translations';

it('extract translations from regular ts files', () => {
  let source = `
    import { __ } from '@wordpress/i18n';
    let translated: string = __('Translate this', 'wp-bundler');
  `;

  let result = extractTranslations(source);
  expect(result).toEqual([
    { text: 'Translate this', domain: 'wp-bundler', node: expect.anything() },
  ]);
});

it('extract translations from tsx files', () => {
  let source = `
    import { _x } from '@wordpress/i18n';
    const Comp: React.FC = () => <p>{_x('Translate this', 'context', 'wp-bundler')}</p>;
  `;

  let result = extractTranslations(source);
  expect(result).toEqual([
    {
      text: 'Translate this',
      context: 'context',
      domain: 'wp-bundler',
      node: expect.anything(),
    },
  ]);
});

it('extract translations from js files', () => {
  let source = `
    import { __ } from '@wordpress/i18n';
    let translated = __('Translate this', 'wp-bundler');
  `;

  let result = extractTranslations(source);
  expect(result).toEqual([
    {
      text: 'Translate this',
      domain: 'wp-bundler',
      node: expect.anything(),
    },
  ]);
});

it('extract translations from jsx files', () => {
  let source = `
    import { _x } from '@wordpress/i18n';
    const Comp = () => <p>{_x('Translate this', 'context', 'wp-bundler')}</p>;
  `;

  let result = extractTranslations(source);
  expect(result).toEqual([
    {
      text: 'Translate this',
      context: 'context',
      domain: 'wp-bundler',
      node: expect.anything(),
    },
  ]);
});

it('extract translations from named imports', () => {
  let source = `
    import { __ } from '@wordpress/i18n';
    __('Translate this', 'wp-bundler');
  `;

  let result = extractTranslations(source);
  expect(result).toEqual([
    { text: 'Translate this', domain: 'wp-bundler', node: expect.anything() },
  ]);
});

it('extract translations from default imports', () => {
  let source = `
    import i18n from '@wordpress/i18n';
    i18n.__('Translate this', 'wp-bundler');
  `;

  let result = extractTranslations(source);
  expect(result).toEqual([
    { text: 'Translate this', domain: 'wp-bundler', node: expect.anything() },
  ]);
});

it('extract translations from namespace imports', () => {
  let source = `
    import * as i18n from '@wordpress/i18n';
    i18n.__('Translate this', 'wp-bundler');
  `;

  let result = extractTranslations(source);
  expect(result).toEqual([
    { text: 'Translate this', domain: 'wp-bundler', node: expect.anything() },
  ]);
});

it('extract translations from calls to window.wp.i18n', () => {
  let source = `
    let translated = window.wp.i18n.__('Translate this', 'wp-bundler');
  `;

  let result = extractTranslations(source);
  expect(result).toEqual([
    {
      text: 'Translate this',
      domain: 'wp-bundler',
      node: expect.anything(),
    },
  ]);
});

it('extract translations from calls to wp.i18n', () => {
  let source = `
    let translated = wp.i18n.__('Translate this', 'wp-bundler');
  `;

  let result = extractTranslations(source);
  expect(result).toEqual([
    {
      text: 'Translate this',
      domain: 'wp-bundler',
      node: expect.anything(),
    },
  ]);
});

it('can extract translations if the named import is renamed on import', () => {
  let source = `
    import { __ as translate, _x as translateX } from '@wordpress/i18n';
    let translated = translate('Translate this', 'wp-bundler');
    let translated2 = translateX('Translate this', 'context', 'wp-bundler');
  `;

  let result = extractTranslations(source);
  expect(result).toEqual([
    {
      text: 'Translate this',
      domain: 'wp-bundler',
      node: expect.anything(),
    },
    {
      text: 'Translate this',
      context: 'context',
      domain: 'wp-bundler',
      node: expect.anything(),
    },
  ]);
});