import type { PartialDeep } from 'type-fest';

/**
 * Lets you pass a deep partial to a slot expecting a type.
 *
 * @returns whatever you pass in
 */
export const fromPartial = <T>(mock: PartialDeep<NoInfer<T>>): T => {
  return mock as T;
};
