import { useEffect, useState } from 'react';
import {
  TREATMENT_STATUS_LABELS,
  type Treatment,
  type TreatmentDraft,
} from '../../../../model/treatment';
import { portFailureMessage } from '../../../../model/portFailure';
import {
  EXTRA_ITEM_TYPE_LABELS,
  type ExtraItem,
  type ExtraItemDraft,
} from '../../../../model/procedureCompletion';
import { CompleteProcedureForm } from './CompleteProcedureForm';
import { CareClosureTracker } from './CareClosureTracker';
import type { PriceEstimate } from '../../../../application/billingEstimate';
import { formatCop, sumCop } from '../../../../model/copMoney';
import type { CareClosure } from '../../../../model/procedureCompletion';
import './treatment-plan.css';

interface Option {
  readonly id: string;
  readonly label: string;
}

export interface TreatmentPlanCardProps {
  readonly load: () => Promise<readonly Treatment[]>;
  readonly onPlan?: (draft: TreatmentDraft) => Promise<void>;
  readonly onStart?: (treatment: Treatment) => Promise<void>;
  readonly onComplete?: (
    treatment: Treatment,
    procedureId: string,
    extras: readonly ExtraItemDraft[],
  ) => Promise<{ closure: CareClosure; extras: readonly ExtraItem[] }>;
  readonly onRefreshClosure?: (closure: CareClosure) => Promise<CareClosure>;
  readonly onRetryClosure?: (
    closure: CareClosure,
    reason: string,
  ) => Promise<CareClosure>;
  readonly catalog: readonly { code: string; label: string }[];
  readonly loadPrices?: () => Promise<PriceEstimate>;
  readonly onDeclareOpen?: () => void;
  readonly diagnoses: readonly Option[];
  readonly appointmentId?: string;
}

/** Page-29 treatment plan: clinical procedures only, never prices. */
export function TreatmentPlanCard({
  load,
  onPlan,
  onStart,
  onComplete,
  onRefreshClosure,
  onRetryClosure,
  catalog,
  loadPrices,
  onDeclareOpen,
  diagnoses,
  appointmentId = '',
}: TreatmentPlanCardProps) {
  const [treatments, setTreatments] = useState<readonly Treatment[]>();
  const [failed, setFailed] = useState(false);
  const [prices, setPrices] = useState<PriceEstimate>();
  const [version, setVersion] = useState(0);
  const [diagnosisId, setDiagnosisId] = useState('');
  const [reason, setReason] = useState('');
  const [codes, setCodes] = useState<readonly string[]>([]);
  const [message, setMessage] = useState<string>();
  const [pending, setPending] = useState(false);
  const [startError, setStartError] = useState<string>();
  const [completing, setCompleting] = useState<{
    treatment: Treatment;
    procedureId: string;
  }>();
  const [notice, setNotice] = useState<string>();
  const [planning, setPlanning] = useState(false);
  const [tracked, setTracked] = useState<readonly CareClosure[]>([]);
  const [unpriced, setUnpriced] = useState<
    readonly (ExtraItem & { procedure: string; appointmentId: string })[]
  >([]);
  const label = (code: string) =>
    catalog.find((item) => item.code === code)?.label ?? code;

  useEffect(() => {
    let active = true;
    load().then(
      (data) => active && setTreatments(data),
      () => active && setFailed(true),
    );
    return () => {
      active = false;
    };
  }, [load, version]);

  useEffect(() => {
    let active = true;
    loadPrices?.().then(
      (data) => active && setPrices(data),
      () => undefined,
    );
    return () => {
      active = false;
    };
  }, [loadPrices]);

  const priced = (treatments ?? [])
    .filter((treatment) => treatment.status !== 'CANCELLED')
    .flatMap((treatment) => treatment.procedures)
    .map((procedure) => prices?.[procedure.procedureCode]?.basePrice)
    .filter((price): price is string => price !== undefined);

  async function start(treatment: Treatment) {
    if (!onStart || pending) return;
    setPending(true);
    setStartError(undefined);
    try {
      await onStart(treatment);
    } catch (error) {
      setStartError(
        portFailureMessage(error, 'No fue posible iniciar el tratamiento.'),
      );
    } finally {
      setPending(false);
      setVersion((value) => value + 1);
    }
  }

  async function plan(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!onPlan || pending) return;
    setPending(true);
    setMessage(undefined);
    try {
      await onPlan({
        ...(diagnosisId ? { diagnosisId } : { clinicalReason: reason }),
        procedures: codes.map((procedureCode) => ({
          procedureCode,
          appointmentId,
        })),
      });
      setReason('');
      setPlanning(false);
      setCodes([]);
      setVersion((value) => value + 1);
    } catch (error) {
      setMessage(
        portFailureMessage(error, 'No fue posible planificar el tratamiento.'),
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="tp-card" aria-labelledby="treatment-plan-title">
      <h2 id="treatment-plan-title">Plan de Tratamiento y Procedimientos</h2>
      {startError && <p role="alert">{startError}</p>}
      {notice && <p role="status">{notice}</p>}
      {onRefreshClosure && tracked.length > 0 && (
        <CareClosureTracker
          closures={tracked}
          procedureLabel={(procedureId) =>
            label(
              treatments
                ?.flatMap((item) => item.procedures)
                .find((item) => item.id === procedureId)?.procedureCode ??
                procedureId,
            )
          }
          onRefresh={onRefreshClosure}
          onRetry={onRetryClosure}
          onChange={(updated) =>
            setTracked(
              tracked.map((item) => (item.id === updated.id ? updated : item)),
            )
          }
        />
      )}
      {unpriced.length > 0 && (
        <section
          className="tp-unpriced"
          aria-label="Extras pendientes de precio en Facturación"
        >
          <h3>Extras pendientes de precio en Facturación</h3>
          <p>
            El precio de cada extra se registra en Facturación; Clinical no
            guarda montos.
          </p>
          <ul>
            {unpriced.map((item) => (
              <li key={item.sourceRecordId}>
                {item.description} · {EXTRA_ITEM_TYPE_LABELS[item.type]} ·
                Cantidad: {item.quantity} · {item.procedure} · Cita:{' '}
                {item.appointmentId} · Ref.: {item.sourceRecordId}
              </li>
            ))}
          </ul>
        </section>
      )}
      {failed ? (
        <p role="alert">No fue posible cargar el plan de tratamiento.</p>
      ) : !treatments ? (
        <p role="status">Cargando plan de tratamiento…</p>
      ) : treatments.length === 0 ? (
        <p>Sin tratamientos planificados.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th scope="col">
                <span className="cr-label">Completado</span>
              </th>
              <th scope="col">Procedimiento</th>
              {prices && <th scope="col">Costo (COP)</th>}
              <th scope="col">Estado</th>
              <th scope="col">Motivo</th>
              {onStart && <th scope="col">Acción</th>}
            </tr>
          </thead>
          <tbody>
            {treatments.flatMap((treatment) =>
              treatment.procedures.map((procedure, index) => (
                <tr key={procedure.id}>
                  <td>
                    <input
                      type="checkbox"
                      aria-label={`Completar ${label(procedure.procedureCode)}`}
                      checked={procedure.status === 'COMPLETED'}
                      disabled={
                        !onComplete ||
                        treatment.status !== 'IN_PROGRESS' ||
                        procedure.status === 'COMPLETED'
                      }
                      onChange={() =>
                        setCompleting({ treatment, procedureId: procedure.id })
                      }
                    />
                  </td>
                  <td>
                    {label(procedure.procedureCode)}
                    {procedure.status !== 'PLANNED' &&
                      ` · ${TREATMENT_STATUS_LABELS[procedure.status]}`}
                  </td>
                  {prices && (
                    <td>
                      {prices[procedure.procedureCode]
                        ? formatCop(prices[procedure.procedureCode].basePrice)
                        : 'Sin precio'}
                    </td>
                  )}
                  {index === 0 && (
                    <>
                      <td rowSpan={treatment.procedures.length}>
                        {TREATMENT_STATUS_LABELS[treatment.status]}
                      </td>
                      <td rowSpan={treatment.procedures.length}>
                        {treatment.clinicalReason ??
                          diagnoses.find(
                            (item) => item.id === treatment.diagnosisId,
                          )?.label ??
                          'Diagnóstico registrado'}
                      </td>
                      {onStart && (
                        <td rowSpan={treatment.procedures.length}>
                          {treatment.status === 'PLANNED' && (
                            <button
                              type="button"
                              className="tp-start"
                              disabled={pending}
                              onClick={() => start(treatment)}
                            >
                              Iniciar tratamiento
                            </button>
                          )}
                        </td>
                      )}
                    </>
                  )}
                </tr>
              )),
            )}
          </tbody>
        </table>
      )}
      {prices && treatments && treatments.length > 0 && (
        <p className="tp-total">
          Total estimado: <strong>{formatCop(sumCop(priced))}</strong> · Valores
          de solo lectura de Facturación.
        </p>
      )}
      {onComplete && completing && (
        <CompleteProcedureForm
          key={completing.procedureId}
          onCancel={() => setCompleting(undefined)}
          onComplete={async (extras) => {
            const { closure, extras: recorded } = await onComplete(
              completing.treatment,
              completing.procedureId,
              extras,
            );
            const procedure = completing.treatment.procedures.find(
              (item) => item.id === completing.procedureId,
            )!;
            setUnpriced([
              ...unpriced,
              ...recorded.map((item) => ({
                ...item,
                procedure: label(procedure.procedureCode),
                appointmentId: procedure.appointmentId,
              })),
            ]);
            setTracked([...tracked, closure]);
            setCompleting(undefined);
            setNotice(
              'Cierre pendiente: Citas y Facturación confirmarán el procedimiento. Los extras se valorizan en Facturación.',
            );
            setVersion((value) => value + 1);
          }}
        />
      )}
      {treatments && !planning && (
        <div className="tp-footer">
          {onPlan && (
            <button
              type="button"
              className="tp-start"
              onClick={() => setPlanning(true)}
            >
              Planificar nuevo tratamiento
            </button>
          )}
          <button
            type="button"
            className="tp-start"
            onClick={() => window.print()}
          >
            Imprimir plan
          </button>
          {onDeclareOpen && (
            <button
              type="button"
              className="tp-primary"
              onClick={onDeclareOpen}
            >
              Declarar atención completada
            </button>
          )}
        </div>
      )}
      {onPlan && treatments && planning && (
        <form className="tp-form" onSubmit={plan} noValidate>
          <label htmlFor="treatment-diagnosis">Diagnóstico asociado</label>
          <select
            id="treatment-diagnosis"
            value={diagnosisId}
            onChange={(event) => setDiagnosisId(event.target.value)}
          >
            <option value="">Sin diagnóstico (indicar motivo)</option>
            {diagnoses.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
          <label htmlFor="treatment-reason">Motivo clínico</label>
          <input
            id="treatment-reason"
            value={reason}
            maxLength={1000}
            disabled={diagnosisId !== ''}
            onChange={(event) => setReason(event.target.value)}
          />
          <fieldset>
            <legend>Procedimientos</legend>
            {catalog.map((item) => (
              <label key={item.code}>
                <input
                  type="checkbox"
                  checked={codes.includes(item.code)}
                  onChange={(event) =>
                    setCodes(
                      event.target.checked
                        ? [...codes, item.code]
                        : codes.filter((code) => code !== item.code),
                    )
                  }
                />
                {item.label}
              </label>
            ))}
          </fieldset>
          {message && <p role="alert">{message}</p>}
          <button type="submit" disabled={pending}>
            Planificar tratamiento
          </button>
          <button type="button" onClick={() => setPlanning(false)}>
            Cancelar
          </button>
        </form>
      )}
    </section>
  );
}
