import { useState } from 'react';

/**
 * One `Idempotency-Key` per user intent (Annex H): kept across retries of
 * the same submission and renewed only after it succeeds.
 */
export function useIntentKey(): [string, () => void] {
  const [key, setKey] = useState(() => crypto.randomUUID());
  return [key, () => setKey(crypto.randomUUID())];
}
