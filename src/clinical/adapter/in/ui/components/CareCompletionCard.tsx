import { useState } from 'react';
import type {
  CareClosure,
  ClinicalCareCompletion,
} from '../../../../model/careCompletion';
import { portFailureMessage } from '../../../../model/portFailure';
import { CareClosureTracker } from './CareClosureTracker';
import { useIntentKey } from './useIntentKey';

export interface CareCompletionCardProps {
  readonly consultations: readonly { id: string; label: string }[];
  readonly onDeclare?: (
    consultationId: string,
    idempotencyKey: string,
  ) => Promise<ClinicalCareCompletion>;
  /** Reads the encounter closure the declaration opened (HU-XCT-001). */
  readonly onReadClosure?: (closureId: string) => Promise<CareClosure>;
  readonly onRetryClosure?: (
    closure: CareClosure,
    reason: string,
    idempotencyKey: string,
  ) => Promise<CareClosure>;
}

/** HU-XCT-001: Dentist declaration; Appointments finalizes administratively. */
export function CareCompletionCard({
  consultations,
  onDeclare,
  onReadClosure,
  onRetryClosure,
}: CareCompletionCardProps) {
  const [consultationId, setConsultationId] = useState('');
  const [message, setMessage] = useState<string>();
  const [pending, setPending] = useState(false);
  const [completion, setCompletion] = useState<ClinicalCareCompletion>();
  const [closure, setClosure] = useState<CareClosure>();
  // Declaring closes the record, so the key is never renewed for this card.
  const [intentKey] = useIntentKey();

  async function declare() {
    if (!onDeclare || pending) return;
    setPending(true);
    setMessage(undefined);
    try {
      const declared = await onDeclare(consultationId, intentKey);
      setCompletion(declared);
      if (onReadClosure)
        setClosure(await onReadClosure(declared.careClosureId));
    } catch (error) {
      setMessage(
        portFailureMessage(error, 'No fue posible declarar el cierre clínico.'),
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="cc-card" aria-labelledby="care-completion-title">
      <h2 id="care-completion-title">Cierre de la atención clínica</h2>
      {completion ? (
        <>
          <p role="status">
            Atención clínica declarada completada el{' '}
            {new Date(completion.completedAt).toLocaleString('es-CO')} ·
            Procedimientos: {completion.procedureIds.length}. Finalización
            administrativa pendiente en Citas (personal autorizado).
          </p>
          {closure && onReadClosure && (
            <CareClosureTracker
              closures={[closure]}
              onRefresh={(current) => onReadClosure(current.id)}
              onRetry={onRetryClosure}
              onChange={setClosure}
            />
          )}
          {message && <p className="cc-error">{message}</p>}
        </>
      ) : !onDeclare ? (
        <p>Solo el odontólogo asignado declara el cierre clínico.</p>
      ) : (
        <>
          <p>
            Declare cuando todas las notas, procedimientos y extras estén
            guardados. Después no se admiten registros tardíos.
          </p>
          <label htmlFor="care-completion-consultation">
            Consulta de la atención
          </label>
          <select
            id="care-completion-consultation"
            value={consultationId}
            onChange={(event) => setConsultationId(event.target.value)}
          >
            <option value="">Seleccione una consulta</option>
            {consultations.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
          {message && <p className="cc-error">{message}</p>}
          <button type="button" disabled={pending} onClick={declare}>
            Declarar atención clínica completada
          </button>
        </>
      )}
    </section>
  );
}
