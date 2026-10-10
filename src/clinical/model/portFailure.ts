/**
 * User-safe message for a failed operation: only typed port failures
 * (`{ code, message }`) are shown; technical errors use the fallback.
 */
export function portFailureMessage(error: unknown, fallback: string): string {
  if (typeof error !== 'object' || error === null || error instanceof Error)
    return fallback;
  const { code, message, traceId } = error as {
    code?: unknown;
    message?: unknown;
    traceId?: unknown;
  };
  if (typeof code !== 'string' || typeof message !== 'string') return fallback;
  // C06: the support reference travels with the central user message.
  return typeof traceId === 'string' && traceId
    ? `${message} Referencia: ${traceId}`
    : message;
}
