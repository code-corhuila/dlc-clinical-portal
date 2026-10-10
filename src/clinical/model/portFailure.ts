/**
 * User-safe message for a failed operation: only typed port failures
 * (`{ code, message }`) are shown; technical errors use the fallback.
 */
export function portFailureMessage(error: unknown, fallback: string): string {
  if (typeof error !== 'object' || error === null || error instanceof Error)
    return fallback;
  const { code, message } = error as { code?: unknown; message?: unknown };
  return typeof code === 'string' && typeof message === 'string'
    ? message
    : fallback;
}
