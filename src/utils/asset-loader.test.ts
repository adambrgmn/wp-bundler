import prettier from 'prettier';
import pluginPhp from '@prettier/plugin-php';
import { toPhpArray } from './asset-loader';

describe('toPhpArray', () => {
  it('formats an empty object', () => {
    expect(format(toPhpArray({}))).toEqual('[]');
  });

  it('formats an empty array', () => {
    expect(format(toPhpArray([]))).toEqual('[]');
  });

  it('formats an object with primitive values', () => {
    expect(format(toPhpArray({ a: 'a', b: 1, c: true }))).toEqual(
      '["a" => "a", "b" => 1, "c" => true]',
    );
  });

  it('formats an array of primitive values', () => {
    expect(format(toPhpArray([1, '2', true]))).toEqual('[1, "2", true]');
  });

  it('formats an object with more complex values within', () => {
    expect(format(toPhpArray({ a: ['a'], b: { foo: true } }))).toEqual(
      '["a" => ["a"], "b" => ["foo" => true]]',
    );
  });

  it('formats an array with more complex values within', () => {
    expect(format(toPhpArray([{ a: 'a' }, [1, 2]]))).toEqual(
      '[["a" => "a"], [1, 2]]',
    );
  });

  it('ignores undefined values in objects', () => {
    expect(format(toPhpArray({ value: undefined }))).toEqual('[]');
  });

  it('references undefined values to an undefined variable in arrays.', () => {
    expect(format(toPhpArray([undefined]))).toEqual('[$__undefined]');
  });
});

function format(code: string) {
  code = `<?php $variable = ${code};`;
  code = prettier.format(code, { plugins: [pluginPhp], parser: 'php' });
  return code.replace('<?php $variable = ', '').replace(/;/g, '').trim();
}
