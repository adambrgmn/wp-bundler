const assertPrefix = 'Assertion failed';

export function assert(value: boolean, message?: string): asserts value;
export function assert<T>(
  value: T | null | undefined,
  message?: string,
): asserts value is T;
export function assert(value: any, message?: string) {
  if (value === false || value === null || typeof value === 'undefined') {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(assertPrefix);
    }

    throw new Error(`${assertPrefix}: ${message ?? ''}`);
  }
}

export function ensure<T>(value: T | null | undefined, message?: string): T {
  if (value === null || typeof value === 'undefined') {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(assertPrefix);
    }

    throw new Error(`${assertPrefix}: ${message ?? ''}`);
  }

  return value;
}

export function isNotNullable<T>(value: T | null | undefined): value is T {
  return value != null;
}
