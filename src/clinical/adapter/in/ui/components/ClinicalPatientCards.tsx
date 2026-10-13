import { useEffect, useState } from 'react';
import type { PatientForCare } from '../../../../model/patientForCare';
import { portFailureMessage } from '../../../../model/portFailure';
import './patient-cards.css';

export interface ClinicalPatientCardsProps {
  readonly load: () => Promise<readonly PatientForCare[]>;
  readonly onOpen: (patientId: string) => void;
  /** Search text from the compositor route (`?q=`), if any. */
  readonly initialQuery?: string;
}

type View =
  | { readonly kind: 'loading' }
  | { readonly kind: 'error'; readonly message: string }
  | { readonly kind: 'ready'; readonly patients: readonly PatientForCare[] };

const initials = (name: string) =>
  name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('');

const normalize = (text: string) =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

/** Clinical home: one card per patient in care, filtered by name or id. */
export function ClinicalPatientCards({
  load,
  onOpen,
  initialQuery = '',
}: ClinicalPatientCardsProps) {
  const [view, setView] = useState<View>({ kind: 'loading' });
  const [query, setQuery] = useState(initialQuery);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    load().then(
      (patients) => active && setView({ kind: 'ready', patients }),
      (error) =>
        active &&
        setView({
          kind: 'error',
          message: portFailureMessage(
            error,
            'No fue posible cargar los pacientes.',
          ),
        }),
    );
    return () => {
      active = false;
    };
  }, [load, attempt]);

  const term = normalize(query.trim());
  const shown =
    view.kind === 'ready'
      ? view.patients.filter(
          (patient) =>
            normalize(patient.name).includes(term) ||
            normalize(patient.id).includes(term),
        )
      : [];

  return (
    <main className="pc-home" aria-labelledby="patient-cards-title">
      <h1 id="patient-cards-title">Historia clínica</h1>
      <p>Seleccione un paciente para ver su historia clínica.</p>
      <label className="pc-search">
        <span>Buscar paciente</span>
        <input
          type="search"
          value={query}
          placeholder="Nombre o identificador"
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>
      {view.kind === 'loading' && <p role="status">Cargando pacientes…</p>}
      {view.kind === 'error' && (
        <div className="pc-error">
          <p role="alert">{view.message}</p>
          <button
            type="button"
            onClick={() => {
              setView({ kind: 'loading' });
              setAttempt((value) => value + 1);
            }}
          >
            Reintentar
          </button>
        </div>
      )}
      {view.kind === 'ready' && view.patients.length === 0 && (
        <p>No hay pacientes en atención clínica.</p>
      )}
      {view.kind === 'ready' &&
        view.patients.length > 0 &&
        shown.length === 0 && <p>Ningún paciente coincide con la búsqueda.</p>}
      <div className="pc-grid">
        {shown.map((patient) => (
          <article key={patient.id} className="pc-card">
            <span className="pc-avatar" aria-hidden="true">
              {initials(patient.name)}
            </span>
            <div>
              <h2>{patient.name}</h2>
              <p>
                ID: {patient.id}
                {patient.phone && ` · ${patient.phone}`}
              </p>
              <span
                className={`pc-status pc-status--${patient.status.toLowerCase()}`}
              >
                {patient.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
              </span>
            </div>
            <button type="button" onClick={() => onOpen(patient.id)}>
              Ver historia clínica
            </button>
          </article>
        ))}
      </div>
    </main>
  );
}
