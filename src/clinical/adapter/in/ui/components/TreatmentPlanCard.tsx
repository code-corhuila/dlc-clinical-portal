import { useEffect, useState } from 'react';
import {
  TREATMENT_STATUS_LABELS,
  type Treatment,
  type TreatmentDraft,
} from '../../../../model/treatment';
import './treatment-plan.css';

interface Option {
  readonly id: string;
  readonly label: string;
}

export interface TreatmentPlanCardProps {
  readonly load: () => Promise<readonly Treatment[]>;
  readonly onPlan?: (draft: TreatmentDraft) => Promise<void>;
  readonly catalog: readonly { code: string; label: string }[];
  readonly diagnoses: readonly Option[];
  readonly appointmentId?: string;
}

/** Page-29 treatment plan: clinical procedures only, never prices. */
export function TreatmentPlanCard({
  load,
  onPlan,
  catalog,
  diagnoses,
  appointmentId = '',
}: TreatmentPlanCardProps) {
  const [treatments, setTreatments] = useState<readonly Treatment[]>();
  const [failed, setFailed] = useState(false);
  const [version, setVersion] = useState(0);
  const [diagnosisId, setDiagnosisId] = useState('');
  const [reason, setReason] = useState('');
  const [codes, setCodes] = useState<readonly string[]>([]);
  const [message, setMessage] = useState<string>();
  const [pending, setPending] = useState(false);
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
      setCodes([]);
      setVersion((value) => value + 1);
    } catch (error) {
      setMessage(
        (error as { message?: string }).message ??
          'No fue posible planificar el tratamiento.',
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="tp-card" aria-labelledby="treatment-plan-title">
      <h2 id="treatment-plan-title">Plan de Tratamiento y Procedimientos</h2>
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
              <th scope="col">Procedimiento</th>
              <th scope="col">Estado</th>
              <th scope="col">Motivo</th>
            </tr>
          </thead>
          <tbody>
            {treatments.flatMap((treatment) =>
              treatment.procedures.map((procedure) => (
                <tr key={procedure.id}>
                  <td>{label(procedure.procedureCode)}</td>
                  <td>{TREATMENT_STATUS_LABELS[procedure.status]}</td>
                  <td>
                    {treatment.clinicalReason ??
                      diagnoses.find(
                        (item) => item.id === treatment.diagnosisId,
                      )?.label ??
                      'Diagnóstico registrado'}
                  </td>
                </tr>
              )),
            )}
          </tbody>
        </table>
      )}
      {onPlan && treatments && (
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
        </form>
      )}
    </section>
  );
}
