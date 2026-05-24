import { he, type I18nKey } from './he';

/** Returns a localized string. Extend with interpolation when needed. */
export function t<K extends keyof I18nKey>(section: K): I18nKey[K] {
  return he[section];
}

export { he };
