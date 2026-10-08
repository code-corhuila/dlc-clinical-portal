import './clinical-record.css';
import {
  resolveClinicalAccess,
  type ClinicalRole,
} from '../../../../model/clinicalAccess';
import type { ClinicalEntry } from '../../../../model/clinicalEntry';
import {
  clinicalEntryLabel,
  toClinicalRecordViewModel,
  type ClinicalRecordStatus,
  type ClinicalRecordViewModel,
} from '../../../../model/clinicalRecordView';

export interface ClinicalRecordEntriesProps {
  readonly role: ClinicalRole | null;
  readonly clinicalReadAuthorized?: boolean;
  readonly status: ClinicalRecordStatus;
  readonly onRetry?: () => void;
}

/** Read-only clinical record slice; denied access wins before any narrative. */
export function ClinicalRecordEntries({
  role,
  clinicalReadAuthorized,
  status,
  onRetry,
}: ClinicalRecordEntriesProps) {
  const view = toClinicalRecordViewModel(
    resolveClinicalAccess(role, clinicalReadAuthorized === true),
    status,
  );

  return (
    <section className="cr-card" aria-labelledby="clinical-record-title">
      <h2 className="cr-title" id="clinical-record-title">
        Registro clínico
      </h2>
      {renderState(view, onRetry)}
    </section>
  );
}

function renderState(view: ClinicalRecordViewModel, onRetry?: () => void) {
  switch (view.state) {
    case 'loading':
      return (
        <div className="cr-state" role="status">
          <span className="cr-skeleton__row" aria-hidden="true" />
          <span className="cr-skeleton__row" aria-hidden="true" />
          <span className="cr-skeleton__row" aria-hidden="true" />
          <p className="cr-state__text">Cargando registro clínico…</p>
        </div>
      );
    case 'empty':
      return (
        <div className="cr-state">
          <h3 className="cr-state__title">Sin entradas clínicas</h3>
          <p className="cr-state__text">Este registro no tiene entradas.</p>
        </div>
      );
    case 'forbidden':
      return (
        <div className="cr-state">
          <h3 className="cr-state__title">Acceso denegado</h3>
          <p className="cr-state__text">
            No hay autorización clínica; el servidor decide el acceso a estas
            entradas.
          </p>
        </div>
      );
    case 'error':
      return (
        <div className="cr-state" role="alert">
          <h3 className="cr-state__title">Error al cargar el registro</h3>
          <p className="cr-state__text">{view.message}</p>
          {onRetry && (
            <button className="cr-button" type="button" onClick={onRetry}>
              Reintentar
            </button>
          )}
        </div>
      );
    case 'data':
      return (
        <ul className="cr-entries">
          {view.entries.map((entry) => (
            <Entry key={entry.id} entry={entry} />
          ))}
        </ul>
      );
  }
}

function Entry({ entry }: { readonly entry: ClinicalEntry }) {
  return (
    <li className="cr-entry">
      <div className="cr-entry__header">
        <span className="cr-entry__kind">{clinicalEntryLabel(entry.kind)}</span>
        <span>
          <span className="cr-label">Autor</span>
          <code>{entry.authorId}</code>
        </span>
        {entry.createdAt !== undefined && (
          <span>
            <span className="cr-label">Fecha y hora</span>
            <time dateTime={entry.createdAt}>{entry.createdAt}</time>
          </span>
        )}
      </div>
      <p className="cr-entry__text">
        <span className="cr-label">Texto</span>
        {entry.text}
      </p>
    </li>
  );
}
