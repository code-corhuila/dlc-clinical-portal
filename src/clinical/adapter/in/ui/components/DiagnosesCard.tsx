import type { ClinicalEntry } from '../../../../model/clinicalEntry';

export interface DiagnosesCardProps {
  readonly entries: readonly ClinicalEntry[];
}

/**
 * Mockup page-29 side card. Lists recorded DIAGNOSIS entries with their
 * linked consultation; no "active/resolved" state exists in the contract.
 */
export function DiagnosesCard({ entries }: DiagnosesCardProps) {
  const diagnoses = entries.filter((entry) => entry.kind === 'DIAGNOSIS');
  const consultationDate = (id?: string) =>
    entries.find((entry) => entry.id === id)?.createdAt?.slice(0, 10);

  return (
    <section className="dx-card" aria-label="Diagnósticos">
      <h2>Diagnósticos</h2>
      {diagnoses.length === 0 ? (
        <p>Sin diagnósticos registrados.</p>
      ) : (
        <ul>
          {diagnoses.map((diagnosis) => (
            <li key={diagnosis.id}>
              <strong>{diagnosis.text}</strong>
              <span>
                Consulta del {consultationDate(diagnosis.consultationId) ?? '—'}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
