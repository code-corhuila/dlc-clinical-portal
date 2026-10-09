import { useState } from 'react';
import { useIntentKey } from './useIntentKey';
import { portFailureMessage } from '../../../../model/portFailure';

export interface AmendEntryFormProps {
  readonly entryId: string;
  readonly initialText: string;
  readonly onSave: (
    correction: { text: string; reason: string },
    idempotencyKey: string,
  ) => Promise<void>;
  readonly onCancel: () => void;
}

/** Correction form: the original entry stays; a linked amendment is added. */
export function AmendEntryForm({
  entryId,
  initialText,
  onSave,
  onCancel,
}: AmendEntryFormProps) {
  const [text, setText] = useState(initialText);
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState<string>();
  const [pending, setPending] = useState(false);
  const [intentKey] = useIntentKey();

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setMessage(undefined);
    try {
      await onSave({ text, reason }, intentKey);
    } catch (error) {
      setMessage(
        portFailureMessage(error, 'No fue posible guardar la corrección.'),
      );
      setPending(false);
    }
  }

  return (
    <form className="cr-amend" onSubmit={save} noValidate>
      <label htmlFor={`amend-text-${entryId}`}>Texto corregido</label>
      <textarea
        id={`amend-text-${entryId}`}
        value={text}
        maxLength={10000}
        disabled={pending}
        onChange={(event) => setText(event.target.value)}
      />
      <label htmlFor={`amend-reason-${entryId}`}>Motivo de la corrección</label>
      <input
        id={`amend-reason-${entryId}`}
        value={reason}
        maxLength={1000}
        disabled={pending}
        onChange={(event) => setReason(event.target.value)}
      />
      {message && <p role="alert">{message}</p>}
      <div>
        <button type="submit" disabled={pending}>
          Guardar corrección
        </button>
        <button type="button" onClick={onCancel} disabled={pending}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
