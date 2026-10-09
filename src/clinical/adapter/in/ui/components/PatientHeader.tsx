import type { PatientForCare } from '../../../../model/patientForCare';

export interface PatientHeaderProps {
  readonly patient: PatientForCare;
  readonly onNewEntry?: () => void;
}

const initials = (name: string) =>
  name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('');

/** Minimized patient identity (PatientForCare); no profile editing here. */
export function PatientHeader({ patient, onNewEntry }: PatientHeaderProps) {
  return (
    <section className="cl-patient" aria-label="Identificación del paciente">
      <span className="cl-patient__avatar" aria-hidden="true">
        {initials(patient.name)}
      </span>
      <div className="cl-patient__identity">
        <h2>{patient.name}</h2>
        <p>
          {patient.phone && <span>{patient.phone}</span>}
          <span>ID: {patient.id}</span>
          <span className="cl-patient__status">
            {patient.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
          </span>
        </p>
      </div>
      {onNewEntry && (
        <button
          type="button"
          className="cl-patient__action"
          onClick={onNewEntry}
        >
          Nueva entrada
        </button>
      )}
    </section>
  );
}
