import { describe, expect, it } from 'vitest';

import { toPhpArray } from './asset-loader.js';

describe('toPhpArray', () => {
  it('formats an empty object', () => {
    expect(toPhpArray({})).toMatchInlineSnapshot('"[]"');
  });

  it('formats an empty array', () => {
    expect(toPhpArray([])).toMatchInlineSnapshot('"[]"');
  });

  it('formats an object with primitive values', () => {
    expect(toPhpArray({ a: 'a', b: 1, c: true })).toMatchInlineSnapshot(
      `"["a"=>"a","b"=>1,"c"=>true,]"`,
    );
  });

  it('formats an array of primitive values', () => {
    expect(toPhpArray([1, '2', true])).toMatchInlineSnapshot(`"[1,"2",true,]"`);
  });

  it('formats an object with more complex values within', () => {
    expect(toPhpArray({ a: ['a'], b: { foo: true } })).toMatchInlineSnapshot(
      `"["a"=>["a",],"b"=>["foo"=>true,],]"`,
    );
  });

  it('formats an array with more complex values within', () => {
    expect(toPhpArray([{ a: 'a' }, [1, 2]])).toMatchInlineSnapshot(`"[["a"=>"a",],[1,2,],]"`);
  });

  it('ignores undefined values in objects', () => {
    expect(toPhpArray({ value: undefined })).toMatchInlineSnapshot('"[]"');
  });

  it('references undefined values to an undefined variable in arrays.', () => {
    expect(toPhpArray([undefined])).toMatchInlineSnapshot('"[$__undefined,]"');
  });
});
