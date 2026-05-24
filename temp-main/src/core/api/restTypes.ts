/**
 * Public types for the REST client.
 *
 * These are deliberately framework-agnostic so the same surface can be
 * consumed from React (via thin hooks), from Redux Toolkit thunks, and
 * from plain modules (tests, build scripts).
 */

/** HTTP verbs the client supports. PATCH/PUT are exposed as helpers. */
export type RestMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * Primitive types acceptable in a query string. `undefined` / `null`
 * values are omitted entirely from the serialized URL.
 */
export type QueryPrimitive = string | number | boolean | null | undefined;

/** A query-string record. Arrays serialize as repeated `?key=a&key=b`. */
export type QueryParams = Record<string, QueryPrimitive | QueryPrimitive[]>;

export interface RestClientOptions {
  /**
   * Base URL prefixed to every request. Must include a scheme
   * (`http://` / `https://`). Trailing slashes are normalized away.
   */
  baseUrl: string;
  /** Default headers merged onto every request. */
  defaultHeaders?: HeadersInit;
  /** Per-request hard timeout (ms). Default: 15000. */
  defaultTimeoutMs?: number;
  /**
   * Retry policy for transient failures (network errors + 5xx). Set to
   * `0` to disable. Default: 2 retries.
   */
  defaultRetries?: number;
  /**
   * Base delay (ms) for exponential backoff between retries. The actual
   * delay is `baseMs * 2^attempt + jitter`. Default: 300.
   */
  retryBaseDelayMs?: number;
  /**
   * Optional async hook that resolves the Authorization header for each
   * request. Useful for refreshable bearer tokens.
   */
  getAuthToken?: () => string | Promise<string | undefined> | undefined;
  /** Custom JSON revival hook applied to every JSON response body. */
  reviveJson?: (key: string, value: unknown) => unknown;
}

export interface RestRequestOptions {
  /** Query string fragments. */
  query?: QueryParams;
  /** Per-request header overrides. Merged on top of defaults. */
  headers?: HeadersInit;
  /**
   * JSON-serializable request body. Mutually exclusive with `formData`
   * and `rawBody`.
   */
  json?: unknown;
  /** `multipart/form-data` body for file uploads. */
  formData?: FormData;
  /**
   * Raw body — passed verbatim to `fetch`. The caller is responsible
   * for setting the matching `Content-Type` header.
   */
  rawBody?: BodyInit;
  /** Per-request timeout override. */
  timeoutMs?: number;
  /** Per-request retry-count override. */
  retries?: number;
  /** Caller-supplied cancellation signal. */
  signal?: AbortSignal;
  /**
   * Expected response shape. `'json'` (default) parses the body as JSON
   * and returns it typed. `'text'` returns the raw text. `'blob'`
   * returns a `Blob`. `'none'` discards the body and returns
   * `undefined`.
   */
  responseType?: 'json' | 'text' | 'blob' | 'none';
}

/**
 * Typed REST error thrown by the client. Distinguishes between:
 *   - `network` — fetch itself rejected (offline, DNS, CORS, etc.).
 *   - `timeout` — request exceeded its timeout.
 *   - `aborted` — caller-supplied AbortSignal fired.
 *   - `http`    — server responded with a non-2xx status.
 *   - `parse`   — response body could not be parsed as expected.
 */
export type RestErrorKind = 'network' | 'timeout' | 'aborted' | 'http' | 'parse';

export class RestError extends Error {
  public readonly kind: RestErrorKind;
  public readonly status?: number;
  public readonly url?: string;
  public readonly body?: unknown;

  constructor(
    kind: RestErrorKind,
    message: string,
    options: { status?: number; url?: string; body?: unknown; cause?: unknown } = {},
  ) {
    super(message);
    this.name = 'RestError';
    this.kind = kind;
    this.status = options.status;
    this.url = options.url;
    this.body = options.body;
    if (options.cause !== undefined) {
      (this as { cause?: unknown }).cause = options.cause;
    }
  }
}

export interface RestResponse<T> {
  data: T;
  status: number;
  headers: Headers;
}
