import { assert, ensure, isNotNullable } from './assert';

describe('assert', () => {
  it("throws an error if check doesn't pass", () => {
    expect(() => assert(false)).toThrow(Error);
    expect(() => assert(null)).toThrow(Error);
    expect(() => assert(undefined)).toThrow(Error);
    expect(() => assert('')).not.toThrow(Error);
    expect(() => assert({})).not.toThrow(Error);
    expect(() => assert([])).not.toThrow(Error);
  });

  it('can pass along an optional message', () => {
    expect(() => assert(false, 'the message')).toThrow('Assertion failed: the message');
  });
});

describe('ensure', () => {
  it('makes sure that a variable is not null|undefined and passes it. Otherwise it throws.', () => {
    expect(() => ensure(null)).toThrow(Error);
    expect(() => ensure(undefined)).toThrow(Error);
    expect(ensure('')).toEqual('');
    expect(ensure(0)).toEqual(0);
  });
});

describe('isNotNullable', () => {
  it('validates that a value is not null or undefined', () => {
    expect(isNotNullable(null)).toBeFalsy();
    expect(isNotNullable(undefined)).toBeFalsy();
    expect(isNotNullable(0)).toBeTruthy();
    expect(isNotNullable('')).toBeTruthy();
  });
});
