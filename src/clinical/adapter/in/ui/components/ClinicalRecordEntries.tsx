import { useState } from 'react';
import './clinical-record.css';
import {
  resolveClinicalAccess,
  type ClinicalRole,
} from '../../../../model/clinicalAccess';
import type { ClinicalEntry } from '../../../../model/clinicalEntry';
import { AmendEntryForm } from './AmendEntryForm';
import {
  clinicalEntryLabel,
  toClinicalRecordViewModel,
  type ClinicalRecordStatus,
  type ClinicalRecordViewModel,
} from '../../../../model/clinicalRecordView';

function formatDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return isoString;
    return new Intl.DateTimeFormat('es', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC',
      timeZoneName: 'short',
    }).format(date);
  } catch {
    return isoString;
  }
}

export interface ClinicalRecordEntriesProps {
  readonly role: ClinicalRole | null;
  readonly clinicalReadAuthorized?: boolean;
  readonly status: ClinicalRecordStatus;
  readonly onRetry?: () => void;
  readonly authorName?: (authorId: string) => string;
  readonly children?: React.ReactNode;
  readonly onAmend?: AmendHandler;
}

type AmendHandler = (
  entry: ClinicalEntry,
  correction: { text: string; reason: string },
) => Promise<void>;

/** Read-only clinical record slice; denied access wins before any narrative. */
export function ClinicalRecordEntries({
  role,
  clinicalReadAuthorized,
  status,
  onRetry,
  authorName = (authorId) => authorId,
  children,
  onAmend,
}: ClinicalRecordEntriesProps) {
  const view = toClinicalRecordViewModel(
    resolveClinicalAccess(role, clinicalReadAuthorized === true),
    status,
  );

  return (
    <section className="cr-card" aria-labelledby="clinical-record-title">
      <h2 className="cr-title" id="clinical-record-title">
        Evolución
      </h2>
      {renderState(view, authorName, onRetry, onAmend)}
      {(view.state === 'data' || view.state === 'empty') && children}
    </section>
  );
}

function renderState(
  view: ClinicalRecordViewModel,
  authorName: (authorId: string) => string,
  onRetry?: () => void,
  onAmend?: AmendHandler,
) {
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
            <Entry
              key={entry.id}
              entry={entry}
              author={authorName(entry.authorId)}
              consultation={view.entries.find(
                (item) => item.id === entry.consultationId,
              )}
              corrected={view.entries.some(
                (item) => item.amendsEntryId === entry.id,
              )}
              onAmend={onAmend}
            />
          ))}
        </ul>
      );
  }
}

function Entry({
  entry,
  author,
  consultation,
  corrected,
  onAmend,
}: {
  readonly entry: ClinicalEntry;
  readonly author: string;
  readonly consultation?: ClinicalEntry;
  readonly corrected: boolean;
  readonly onAmend?: AmendHandler;
}) {
  const [amending, setAmending] = useState(false);
  return (
    <li className="cr-entry">
      <div className="cr-entry__timeline-marker" aria-hidden="true"></div>
      <div className="cr-entry__content">
        <div className="cr-entry__header">
          <div className="cr-entry__header-left">
            {entry.createdAt !== undefined && (
              <span>
                <span className="cr-label">Fecha y hora</span>
                <time className="cr-entry__time" dateTime={entry.createdAt}>
                  {formatDate(entry.createdAt)}
                </time>
              </span>
            )}
            <span className="cr-entry__kind">
              {clinicalEntryLabel(entry.kind)}
            </span>
            {corrected && <span className="cr-entry__kind">Corregida</span>}
          </div>
          <div className="cr-entry__author">
            <span className="cr-label">Autor</span>
            <code>{author}</code>
          </div>
        </div>
        <p className="cr-entry__text">
          <span className="cr-label">Texto</span>
          {entry.text}
        </p>
        {consultation?.createdAt && (
          <p className="cr-entry__link">
            Vinculado a la consulta del {formatDate(consultation.createdAt)}
          </p>
        )}
        {entry.amendsEntryId && (
          <p className="cr-entry__link">
            Corrección de una entrada anterior · Motivo: {entry.amendmentReason}
          </p>
        )}
        {onAmend && !amending && (
          <button
            type="button"
            className="cr-entry__amend"
            onClick={() => setAmending(true)}
          >
            Corregir entrada
          </button>
        )}
        {onAmend && amending && (
          <AmendEntryForm
            entryId={entry.id}
            initialText={entry.text}
            onCancel={() => setAmending(false)}
            onSave={async (correction) => {
              await onAmend(entry, correction);
              setAmending(false);
            }}
          />
        )}
      </div>
    </li>
  );
}
