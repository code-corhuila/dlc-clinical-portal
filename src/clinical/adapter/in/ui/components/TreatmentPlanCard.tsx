import { useEffect, useState } from 'react';
import {
  TREATMENT_STATUS_LABELS,
  type Treatment,
} from '../../../../model/treatment';
import './treatment-plan.css';

export interface TreatmentPlanCardProps {
  readonly load: () => Promise<readonly Treatment[]>;
  readonly catalog: readonly { code: string; label: string }[];
  readonly diagnoses: readonly { id: string; label: string }[];
}

/** Page-29 treatment plan: clinical procedures only, never prices. */
export function TreatmentPlanCard({
  load,
  catalog,
  diagnoses,
}: TreatmentPlanCardProps) {
  const [treatments, setTreatments] = useState<readonly Treatment[]>();
  const [failed, setFailed] = useState(false);
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
  }, [load]);

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
    </section>
  );
}
