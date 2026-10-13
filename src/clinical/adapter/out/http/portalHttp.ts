/**
 * Shared HTTP capability supplied by dlc-front (composition contract v1, C06).
 * Clinical never creates its own client, token or correlation header.
 */
export interface PortalHttpRequest {
  readonly method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  readonly path: string;
  readonly query?: Readonly<Record<string, readonly string[]>>;
  readonly body?: unknown;
  readonly headers?: Readonly<Record<string, string>>;
  readonly signal?: AbortSignal;
}

export type PortalHttpResult =
  | {
      readonly ok: true;
      readonly status: number;
      readonly data: unknown;
      readonly correlationId: string;
    }
  | {
      readonly ok: false;
      readonly status: number;
      readonly error: string;
      readonly message: string;
      readonly details?: unknown;
      readonly traceId?: string;
      readonly correlationId: string;
      readonly kind:
        'http' | 'network' | 'timeout' | 'cancelled' | 'contract' | 'session';
      readonly retryable: boolean;
    };

export interface PortalHttp {
  request(request: PortalHttpRequest): Promise<PortalHttpResult>;
}

/**
 * Typed port failure from a C06 Result: the message is already the central
 * user message; 403 keeps the forbidden state and never ends the session.
 */
export async function send<T>(
  http: PortalHttp,
  request: PortalHttpRequest,
): Promise<T> {
  const result = await http.request(request);
  if (result.ok) return result.data as T;
  if (result.kind === 'cancelled') throw { code: 'CANCELLED' };
  throw {
    code: result.status === 403 ? 'FORBIDDEN' : result.error,
    message: result.message,
    details: result.details,
    traceId: result.traceId ?? result.correlationId,
  };
}
