import { isPlainObject } from './record';

export function unwrapVal<T>(input: T): T {
  if (Array.isArray(input)) {
    return input.map((item) => unwrapVal(item)) as T;
  }

  if (!isPlainObject(input)) {
    return input;
  }

  const keys = Object.keys(input);
  if (keys.length === 1 && keys[0] === 'val') {
    return unwrapVal(input.val) as T;
  }

  const output: Record<string, unknown> = {};
  for (const key of keys) {
    const value = input[key];
    if (isPlainObject(value)) {
      const nestedKeys = Object.keys(value);
      if (nestedKeys.length === 1 && nestedKeys[0] === 'val') {
        output[key] = unwrapVal(value.val);
        continue;
      }
    }
    output[key] = unwrapVal(value);
  }

  return output as T;
}

export function unwrapValLax<T>(input: T): T {
  if (Array.isArray(input)) {
    return input.map((item) => unwrapValLax(item)) as T;
  }

  if (!isPlainObject(input)) {
    return input;
  }

  if ('val' in input) {
    return unwrapValLax(input.val) as T;
  }

  const output: Record<string, unknown> = {};
  for (const key of Object.keys(input)) {
    output[key] = unwrapValLax(input[key]);
  }

  return output as T;
}
