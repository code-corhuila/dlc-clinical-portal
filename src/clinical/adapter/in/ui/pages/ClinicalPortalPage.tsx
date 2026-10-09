import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ClinicalRecordEntriesWorkflow,
  type ClinicalRecordEntriesPort,
} from '../../../../application/clinicalRecordEntriesWorkflow';
import type { RecordClinicalEntry } from '../../../../application/recordClinicalEntry';
import {
  resolveClinicalAccess,
  type ClinicalRole,
} from '../../../../model/clinicalAccess';
import type { ClinicalRecordStatus } from '../../../../model/clinicalRecordView';
import { ClinicalRecordEntries } from '../components/ClinicalRecordEntries';
import { ClinicalEntryComposer } from '../components/ClinicalEntryComposer';

export interface ClinicalPortalPageProps {
  readonly patientId?: string | null;
  readonly role?: ClinicalRole | null;
  readonly clinicalReadAuthorized?: boolean;
  readonly clinicalWriteAuthorized?: boolean;
  readonly readPort?: ClinicalRecordEntriesPort;
  readonly writer?: RecordClinicalEntry;
  readonly authorName?: (authorId: string) => string;
}

interface RecordView {
  readonly patientId: string | null;
  readonly context: object | null;
  readonly status: ClinicalRecordStatus;
}

/**
 * Current inbound UI adapter for the Clinical remote.
 */
export function ClinicalPortalPage({
  patientId,
  role = null,
  clinicalReadAuthorized = false,
  clinicalWriteAuthorized = false,
  readPort,
  writer,
  authorName,
}: ClinicalPortalPageProps) {
  const request = useRef(0);
  const [retry, setRetry] = useState(0);
  const [view, setView] = useState<RecordView>({
    patientId: null,
    context: null,
    status: { kind: 'loading' },
  });
  const allowed =
    resolveClinicalAccess(role, clinicalReadAuthorized) === 'granted';
  const workflow = useMemo(
    () => (readPort ? new ClinicalRecordEntriesWorkflow(readPort) : undefined),
    [readPort],
  );
  const context = useMemo(
    () => ({ workflow, allowed, role, clinicalReadAuthorized }),
    [allowed, clinicalReadAuthorized, role, workflow],
  );

  useEffect(() => {
    const activeRequest = ++request.current;
    let active = true;
    if (!patientId || !allowed || !workflow) {
      return () => {
        active = false;
      };
    }
    void workflow.load(patientId).then(() => {
      if (!active || activeRequest !== request.current) return;
      setView({ patientId, context, status: workflow.status });
    });
    return () => {
      active = false;
    };
  }, [allowed, context, patientId, retry, workflow]);

  const status = !allowed
    ? { kind: 'forbidden' as const }
    : patientId && view.patientId === patientId && view.context === context
      ? view.status
      : { kind: 'loading' as const };
  const bound = readPort !== undefined;

  return (
    <main
      className="portal-placeholder"
      aria-labelledby="clinical-portal-title"
    >
      <h1 id="clinical-portal-title">
        {bound ? 'Historia clínica' : 'Clinical portal'}
      </h1>
      {bound ? (
        <>
          <ClinicalRecordEntries
            role={role}
            clinicalReadAuthorized={clinicalReadAuthorized}
            status={status}
            authorName={authorName}
            onRetry={
              allowed && patientId
                ? () => setRetry((value) => value + 1)
                : undefined
            }
          />
          <ClinicalEntryComposer
            role={role}
            clinicalWriteAuthorized={clinicalWriteAuthorized}
            recordWritable={status.kind === 'ready'}
            onSubmit={
              writer && patientId
                ? async (entry) => {
                    await writer.execute(
                      { patientId, role, clinicalWriteAuthorized },
                      entry,
                    );
                    setRetry((value) => value + 1);
                  }
                : undefined
            }
          />
        </>
      ) : (
        <>
          <p>The Clinical remote is available for federation.</p>
          <p>
            Domain workflows require the shared client and session supplied by{' '}
            <code>dlc-front</code>.
          </p>
        </>
      )}
    </main>
  );
}
