import { useRef, useState } from 'react';
import { portFailureMessage } from '../../../../model/portFailure';
import type { CareClosure } from '../../../../model/procedureCompletion';

const STATUS_LABELS: Record<CareClosure['status'], string> = {
  CLOSURE_PENDING: 'Cierre pendiente',
  CLOSURE_COMPLETED: 'Cierre completado',
  CLOSURE_FAILED: 'Cierre fallido',
};
const outcome = (value?: 'PENDING' | 'COMPLETED') =>
  value === 'COMPLETED' ? 'completado' : 'pendiente';

export interface CareClosureTrackerProps {
  readonly closures: readonly CareClosure[];
  readonly procedureLabel: (procedureId: string) => string;
  readonly onRefresh: (closure: CareClosure) => Promise<CareClosure>;
  readonly onRetry?: (
    closure: CareClosure,
    reason: string,
    idempotencyKey: string,
  ) => Promise<CareClosure>;
  readonly onChange: (closure: CareClosure) => void;
}

/** HU-XCT-001: actual downstream outcomes; never shown complete too early. */
export function CareClosureTracker({
  closures,
  procedureLabel,
  onRefresh,
  onRetry,
  onChange,
}: CareClosureTrackerProps) {
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string>();
  // One key per failed closure version: kept across retries of that failure.
  const intentKeys = useRef(new Map<string, string>());
  const intentKey = ({ id, version }: CareClosure) => {
    const failure = `${id}:${version}`;
    if (!intentKeys.current.has(failure))
      intentKeys.current.set(failure, crypto.randomUUID());
    return intentKeys.current.get(failure)!;
  };

  async function run(action: () => Promise<CareClosure>) {
    setMessage(undefined);
    try {
      onChange(await action());
    } catch (error) {
      setMessage(
        portFailureMessage(error, 'No fue posible consultar el cierre.'),
      );
    }
  }

  return (
    <section className="tp-closures" aria-label="Seguimiento del cierre">
      <h3>Seguimiento del cierre</h3>
      {message && <p role="alert">{message}</p>}
      <ul>
        {closures.map((closure) => (
          <li key={closure.id}>
            <strong>
              {procedureLabel(closure.procedureId)}:{' '}
              {STATUS_LABELS[closure.status]}
            </strong>
            <span>
              Citas: {outcome(closure.appointmentOutcome)} · Facturación:{' '}
              {outcome(closure.billingOutcome)}
            </span>
            {closure.failureReason && <span>{closure.failureReason}</span>}
            {closure.status !== 'CLOSURE_COMPLETED' && (
              <button
                type="button"
                onClick={() => run(() => onRefresh(closure))}
              >
                Actualizar estado
              </button>
            )}
            {onRetry && closure.status === 'CLOSURE_FAILED' && (
              <>
                <label>
                  Motivo del reintento
                  <input
                    value={reasons[closure.id] ?? ''}
                    maxLength={1000}
                    onChange={(event) =>
                      setReasons({
                        ...reasons,
                        [closure.id]: event.target.value,
                      })
                    }
                  />
                </label>
                <button
                  type="button"
                  onClick={() =>
                    run(() =>
                      onRetry(
                        closure,
                        reasons[closure.id] ?? '',
                        intentKey(closure),
                      ),
                    )
                  }
                >
                  Reintentar cierre
                </button>
              </>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
