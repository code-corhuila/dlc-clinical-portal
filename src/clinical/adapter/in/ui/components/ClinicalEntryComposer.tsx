import { useState } from 'react';
import type { ClinicalRole } from '../../../../model/clinicalAccess';
import { resolveClinicalWriteAccess } from '../../../../model/clinicalAccess';
import {
  validateClinicalEntryRequest,
  type ClinicalEntryRequest,
  type ClinicalEntryRequestKind,
} from '../../../../model/clinicalEntryRequest';
import { portFailureMessage } from '../../../../model/portFailure';
import { useIntentKey } from './useIntentKey';
import './clinical-entry-composer.css';

export interface ClinicalEntryComposerProps {
  readonly role: ClinicalRole | null;
  readonly clinicalWriteAuthorized?: boolean;
  readonly recordWritable?: boolean;
  readonly onSubmit?: (
    request: ClinicalEntryRequest,
    idempotencyKey: string,
  ) => Promise<void>;
  readonly consultations?: readonly { id: string; label: string }[];
}

/** UI-only composer; the supplied port is responsible for integrated submission. */
export function ClinicalEntryComposer({
  role,
  clinicalWriteAuthorized,
  recordWritable,
  onSubmit,
  consultations = [],
}: ClinicalEntryComposerProps) {
  const [kind, setKind] = useState<ClinicalEntryRequestKind>('CONSULTATION');
  const [text, setText] = useState('');
  const [consultationId, setConsultationId] = useState('');
  const [message, setMessage] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const [intentKey, renewIntentKey] = useIntentKey();
  const allowed =
    resolveClinicalWriteAccess(role, clinicalWriteAuthorized) === 'granted' &&
    recordWritable !== false;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!onSubmit || submitting) return;

    const request = validateClinicalEntryRequest(kind, text, consultationId);
    if (typeof request === 'string') {
      setMessage(request);
      return;
    }
    setMessage(undefined);
    setSubmitting(true);
    try {
      await onSubmit(request, intentKey);
      renewIntentKey();
      setText('');
    } catch (error) {
      setMessage(
        portFailureMessage(
          error,
          'No fue posible enviar la entrada clínica. Inténtelo de nuevo.',
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (!allowed)
    return (
      <section className="cec-card" aria-labelledby="composer-title">
        <h2 id="composer-title">Acceso no autorizado</h2>
        <p>No tiene autorización clínica para registrar entradas.</p>
      </section>
    );

  const unavailable = onSubmit === undefined;
  return (
    <section className="cec-card" aria-labelledby="composer-title">
      <h2 id="composer-title">Nueva entrada clínica</h2>
      <form onSubmit={submit} noValidate>
        <label htmlFor="entry-kind">Tipo de entrada</label>
        <select
          id="entry-kind"
          value={kind}
          disabled={submitting}
          onChange={(event) =>
            setKind(event.target.value as ClinicalEntryRequestKind)
          }
        >
          <option value="CONSULTATION">Consulta</option>
          <option value="DIAGNOSIS">Diagnóstico</option>
          <option value="EVOLUTION">Evolución</option>
        </select>
        {kind === 'DIAGNOSIS' && (
          <>
            <label htmlFor="entry-consultation">Consulta asociada</label>
            <select
              id="entry-consultation"
              value={consultationId}
              disabled={submitting}
              onChange={(event) => setConsultationId(event.target.value)}
            >
              <option value="">Seleccione una consulta</option>
              {consultations.map((consultation) => (
                <option key={consultation.id} value={consultation.id}>
                  {consultation.label}
                </option>
              ))}
            </select>
          </>
        )}
        <label htmlFor="entry-text">Narrativa clínica</label>
        <textarea
          id="entry-text"
          value={text}
          maxLength={10000}
          disabled={submitting}
          aria-describedby={message ? 'entry-message' : undefined}
          onChange={(event) => setText(event.target.value)}
        />
        {message && (
          <p id="entry-message" role="alert">
            {message}
          </p>
        )}
        {unavailable && (
          <p>Integración pendiente: el envío clínico no está disponible.</p>
        )}
        <button type="submit" disabled={unavailable || submitting}>
          {submitting ? 'Enviando entrada' : 'Registrar entrada'}
        </button>
      </form>
    </section>
  );
}
