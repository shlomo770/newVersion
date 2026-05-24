import { getApiBaseUrl } from '../config/servers';
import { RestClient } from './restClient';
import type { RestClientOptions } from './restTypes';

let instance: RestClient | null = null;

/**
 * Lazily-constructed application-wide REST client.
 *
 * The first call resolves the API base URL from `communication.json`
 * (or the `VITE_API_SERVER` / `VITE_API_BASE_URL` env override) and
 * caches a single `RestClient` for the rest of the session.
 *
 * Throws when no REST endpoint is configured — callers that need to
 * degrade gracefully should call `getApiBaseUrl()` directly and decide.
 *
 * Optional `overrides` are applied only on the very first call;
 * subsequent calls return the cached instance untouched. Use
 * `resetRestClient()` from tests / HMR scenarios when you need to
 * rebuild it.
 */
export function getRestClient(overrides?: Partial<RestClientOptions>): RestClient {
  if (instance) return instance;

  const baseUrl = overrides?.baseUrl ?? getApiBaseUrl();
  if (!baseUrl) {
    throw new Error(
      'REST client is not configured. Set `servers.apiServer` in communication.json ' +
        'or define the `VITE_API_SERVER` environment variable.',
    );
  }

  instance = new RestClient({ ...overrides, baseUrl });
  return instance;
}

/** Drop the cached singleton — primarily for tests / HMR. */
export function resetRestClient(): void {
  instance = null;
}
