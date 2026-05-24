import {
  RestError,
  type QueryParams,
  type QueryPrimitive,
  type RestClientOptions,
  type RestMethod,
  type RestRequestOptions,
  type RestResponse,
} from './restTypes';

const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_RETRIES = 2;
const DEFAULT_RETRY_BASE_MS = 300;
const MAX_RETRY_JITTER_MS = 150;
const RETRYABLE_STATUSES: ReadonlySet<number> = new Set([408, 425, 429, 500, 502, 503, 504]);

/**
 * Lightweight typed REST client.
 *
 * Design goals:
 *   - Native `fetch` only — no third-party dependencies.
 *   - Typed responses + a single `RestError` surface.
 *   - First-class cancellation via `AbortSignal` (composes with the
 *     internal timeout signal).
 *   - Idempotent retry policy with exponential backoff + jitter; only
 *     `GET` / `HEAD` / `OPTIONS` and explicitly transient (5xx, 408,
 *     425, 429) responses are retried.
 *   - Hookable auth (`getAuthToken`) so token refresh stays out of the
 *     transport layer.
 *
 * Construction:
 *   ```ts
 *   const api = new RestClient({ baseUrl: getApiBaseUrl()! });
 *   const targets = await api.get<Target[]>('/targets');
 *   await api.post('/targets/abort', { json: { id } });
 *   ```
 */
export class RestClient {
  private readonly baseUrl: string;
  private readonly defaultHeaders: Headers;
  private readonly defaultTimeoutMs: number;
  private readonly defaultRetries: number;
  private readonly retryBaseDelayMs: number;
  private readonly getAuthToken: RestClientOptions['getAuthToken'];
  private readonly reviveJson: RestClientOptions['reviveJson'];

  constructor(options: RestClientOptions) {
    this.baseUrl = stripTrailingSlash(options.baseUrl);
    this.defaultHeaders = new Headers(options.defaultHeaders);
    this.defaultTimeoutMs = options.defaultTimeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.defaultRetries = Math.max(0, options.defaultRetries ?? DEFAULT_RETRIES);
    this.retryBaseDelayMs = Math.max(0, options.retryBaseDelayMs ?? DEFAULT_RETRY_BASE_MS);
    this.getAuthToken = options.getAuthToken;
    this.reviveJson = options.reviveJson;
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  /* ------------------------------------------------------------------ */
  /*  Verb-typed conveniences                                            */
  /* ------------------------------------------------------------------ */

  public get<T>(path: string, options?: RestRequestOptions): Promise<T> {
    return this.requestData<T>('GET', path, options);
  }

  public post<T>(path: string, options?: RestRequestOptions): Promise<T> {
    return this.requestData<T>('POST', path, options);
  }

  public put<T>(path: string, options?: RestRequestOptions): Promise<T> {
    return this.requestData<T>('PUT', path, options);
  }

  public patch<T>(path: string, options?: RestRequestOptions): Promise<T> {
    return this.requestData<T>('PATCH', path, options);
  }

  public delete<T = void>(path: string, options?: RestRequestOptions): Promise<T> {
    return this.requestData<T>('DELETE', path, options);
  }

  /**
   * Full-response variant — exposes status code + headers alongside
   * the parsed body. Useful for pagination / ETag flows.
   */
  public async fetch<T>(
    method: RestMethod,
    path: string,
    options: RestRequestOptions = {},
  ): Promise<RestResponse<T>> {
    return this.executeWithRetry<T>(method, path, options);
  }

  /* ------------------------------------------------------------------ */
  /*  Internals                                                          */
  /* ------------------------------------------------------------------ */

  private async requestData<T>(
    method: RestMethod,
    path: string,
    options?: RestRequestOptions,
  ): Promise<T> {
    const response = await this.executeWithRetry<T>(method, path, options ?? {});
    return response.data;
  }

  private async executeWithRetry<T>(
    method: RestMethod,
    path: string,
    options: RestRequestOptions,
  ): Promise<RestResponse<T>> {
    const maxRetries = options.retries ?? this.defaultRetries;
    const url = this.buildUrl(path, options.query);
    let attempt = 0;
    while (true) {
      try {
        return await this.executeOnce<T>(method, url, options);
      } catch (error) {
        const retryable = isRetryable(method, error);
        if (!retryable || attempt >= maxRetries) {
          throw error;
        }
        await sleep(computeBackoffMs(this.retryBaseDelayMs, attempt));
        attempt += 1;
      }
    }
  }

  private async executeOnce<T>(
    method: RestMethod,
    url: string,
    options: RestRequestOptions,
  ): Promise<RestResponse<T>> {
    const headers = await this.buildHeaders(options.headers, Boolean(options.json));
    const body = buildBody(options);
    const { signal, abortTimeout } = composeAbortSignal(
      options.signal,
      options.timeoutMs ?? this.defaultTimeoutMs,
    );

    let response: Response;
    try {
      response = await fetch(url, { method, headers, body, signal });
    } catch (cause) {
      abortTimeout();
      if (isAbortError(cause)) {
        if (options.signal?.aborted) {
          throw new RestError('aborted', 'Request aborted', { url, cause });
        }
        throw new RestError('timeout', 'Request timed out', { url, cause });
      }
      throw new RestError('network', describeError(cause), { url, cause });
    }
    abortTimeout();

    if (!response.ok) {
      const errorBody = await safeParseErrorBody(response);
      throw new RestError('http', `HTTP ${response.status} ${response.statusText}`.trim(), {
        status: response.status,
        url,
        body: errorBody,
      });
    }

    const data = await parseResponseBody<T>(response, options.responseType ?? 'json', this.reviveJson);
    return { data, status: response.status, headers: response.headers };
  }

  private async buildHeaders(perRequest?: HeadersInit, hasJsonBody = false): Promise<Headers> {
    const merged = new Headers(this.defaultHeaders);
    if (perRequest) {
      new Headers(perRequest).forEach((value, key) => merged.set(key, value));
    }
    if (hasJsonBody && !merged.has('Content-Type')) {
      merged.set('Content-Type', 'application/json');
    }
    if (!merged.has('Accept')) {
      merged.set('Accept', 'application/json, text/plain, */*');
    }
    if (this.getAuthToken && !merged.has('Authorization')) {
      const token = await this.getAuthToken();
      if (token) merged.set('Authorization', `Bearer ${token}`);
    }
    return merged;
  }

  private buildUrl(path: string, query?: QueryParams): string {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const absolute = /^https?:\/\//i.test(path) ? path : `${this.baseUrl}${normalizedPath}`;
    const queryString = buildQueryString(query);
    if (!queryString) return absolute;
    const separator = absolute.includes('?') ? '&' : '?';
    return `${absolute}${separator}${queryString}`;
  }
}

/* ====================================================================
 *  Helpers (module-local, not exported)
 * ====================================================================*/

function stripTrailingSlash(url: string): string {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

function buildBody(options: RestRequestOptions): BodyInit | undefined {
  if (options.json !== undefined) return JSON.stringify(options.json);
  if (options.formData) return options.formData;
  if (options.rawBody !== undefined) return options.rawBody;
  return undefined;
}

function buildQueryString(query?: QueryParams): string {
  if (!query) return '';
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (Array.isArray(value)) {
      for (const item of value) appendQueryValue(params, key, item);
    } else {
      appendQueryValue(params, key, value);
    }
  }
  const result = params.toString();
  return result;
}

function appendQueryValue(params: URLSearchParams, key: string, value: QueryPrimitive): void {
  if (value === undefined || value === null) return;
  params.append(key, String(value));
}

function composeAbortSignal(
  external: AbortSignal | undefined,
  timeoutMs: number,
): { signal: AbortSignal; abortTimeout: () => void } {
  const controller = new AbortController();
  const onExternalAbort = () => controller.abort(external?.reason);

  if (external) {
    if (external.aborted) controller.abort(external.reason);
    else external.addEventListener('abort', onExternalAbort, { once: true });
  }

  const timeoutHandle = setTimeout(() => controller.abort(new DOMException('Timeout', 'AbortError')), timeoutMs);

  return {
    signal: controller.signal,
    abortTimeout: () => {
      clearTimeout(timeoutHandle);
      external?.removeEventListener('abort', onExternalAbort);
    },
  };
}

function isAbortError(error: unknown): boolean {
  return (
    error instanceof DOMException && error.name === 'AbortError'
  ) || (typeof error === 'object' && error !== null && (error as { name?: unknown }).name === 'AbortError');
}

function describeError(error: unknown): string {
  if (!error) return 'Unknown network error';
  if (error instanceof Error) return error.message || error.name;
  return String(error);
}

async function safeParseErrorBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') ?? '';
  try {
    if (contentType.includes('application/json')) return await response.json();
    return await response.text();
  } catch {
    return undefined;
  }
}

async function parseResponseBody<T>(
  response: Response,
  responseType: NonNullable<RestRequestOptions['responseType']>,
  reviver: RestClientOptions['reviveJson'],
): Promise<T> {
  if (responseType === 'none' || response.status === 204) {
    return undefined as unknown as T;
  }
  if (responseType === 'text') {
    return (await response.text()) as unknown as T;
  }
  if (responseType === 'blob') {
    return (await response.blob()) as unknown as T;
  }
  const text = await response.text();
  if (!text) return undefined as unknown as T;
  try {
    return JSON.parse(text, reviver) as T;
  } catch (cause) {
    throw new RestError('parse', 'Failed to parse JSON response body', {
      url: response.url,
      body: text,
      cause,
    });
  }
}

function isRetryable(method: RestMethod, error: unknown): boolean {
  if (method !== 'GET' && method !== 'DELETE') return false;
  if (error instanceof RestError) {
    if (error.kind === 'network' || error.kind === 'timeout') return true;
    if (error.kind === 'http' && error.status !== undefined && RETRYABLE_STATUSES.has(error.status)) {
      return true;
    }
  }
  return false;
}

function computeBackoffMs(baseMs: number, attempt: number): number {
  const exponential = baseMs * 2 ** attempt;
  const jitter = Math.random() * MAX_RETRY_JITTER_MS;
  return exponential + jitter;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
