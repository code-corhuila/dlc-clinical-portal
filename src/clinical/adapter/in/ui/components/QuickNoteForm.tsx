import { useState } from 'react';
import { useIntentKey } from './useIntentKey';
import {
  validateClinicalEntryRequest,
  type ClinicalEntryRequest,
} from '../../../../model/clinicalEntryRequest';

export interface QuickNoteFormProps {
  readonly onSubmit: (
    request: ClinicalEntryRequest,
    idempotencyKey: string,
  ) => Promise<void>;
}

/** Mockup page-29 quick note: appends an EVOLUTION entry. */
export function QuickNoteForm({ onSubmit }: QuickNoteFormProps) {
  const [text, setText] = useState('');
  const [message, setMessage] = useState<string>();
  const [pending, setPending] = useState(false);
  const [intentKey, renewIntentKey] = useIntentKey();

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const request = validateClinicalEntryRequest('EVOLUTION', text);
    if (typeof request === 'string') return setMessage(request);
    setMessage(undefined);
    setPending(true);
    try {
      await onSubmit(request, intentKey);
      renewIntentKey();
      setText('');
    } catch {
      setMessage('No fue posible enviar la nota. Inténtelo de nuevo.');
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="cr-quick-note" onSubmit={submit} noValidate>
      <input
        aria-label="Nota rápida"
        placeholder="Añadir nota rápida…"
        value={text}
        maxLength={10000}
        disabled={pending}
        aria-describedby={message ? 'quick-note-message' : undefined}
        onChange={(event) => setText(event.target.value)}
      />
      <button type="submit" aria-label="Enviar nota" disabled={pending}>
        ➤
      </button>
      {message && (
        <p id="quick-note-message" role="alert">
          {message}
        </p>
      )}
    </form>
  );
}
