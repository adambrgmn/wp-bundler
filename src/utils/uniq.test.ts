import { uniq } from './uniq';

it('compares with === by default', () => {
  expect(uniq([1, 1, 2, 2, 3, 3])).toEqual([1, 2, 3]);
  expect(uniq(['1', 1])).toEqual(['1', 1]);

  let ref = {};
  expect(uniq([ref, ref])).toEqual([ref]);
  expect(uniq([{}, {}])).toEqual([{}, {}]);
});

it('is possible to provide an own compare fn', () => {
  expect(uniq([{ id: 1 }, { id: 1 }, { id: 2 }], (a, b) => a.id === b.id)).toEqual([{ id: 1 }, { id: 2 }]);
});
