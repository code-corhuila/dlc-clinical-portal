import type { ClinicalEntry } from '../../../../model/clinicalEntry';
import { clinicDate, clinicDay } from '../clinicTime';
import { ClinicalIcon } from './ClinicalIcon';

export interface DiagnosesCardProps {
  readonly entries: readonly ClinicalEntry[];
}

/**
 * Mockup page-29 side card. Lists recorded DIAGNOSIS entries with their
 * linked consultation; no "active/resolved" state exists in the contract.
 */
const detected = (iso?: string) => (iso ? clinicDate(iso) : '—');

export function DiagnosesCard({ entries }: DiagnosesCardProps) {
  const diagnoses = entries.filter((entry) => entry.kind === 'DIAGNOSIS');
  const consultationDate = (id?: string) => {
    const createdAt = entries.find((entry) => entry.id === id)?.createdAt;
    return createdAt ? clinicDay(createdAt) : undefined;
  };

  return (
    <section className="dx-card" aria-label="Diagnósticos Activos">
      <h2>
        <ClinicalIcon name="diagnosis" />
        Diagnósticos Activos
      </h2>
      {diagnoses.length === 0 ? (
        <p>Sin diagnósticos registrados.</p>
      ) : (
        <ul>
          {diagnoses.map((diagnosis) => (
            <li key={diagnosis.id}>
              <strong>
                <ClinicalIcon name="alert" />
                {diagnosis.text}
              </strong>
              <span>
                Detectado: {detected(diagnosis.createdAt)} · Consulta del{' '}
                {consultationDate(diagnosis.consultationId) ?? '—'}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
