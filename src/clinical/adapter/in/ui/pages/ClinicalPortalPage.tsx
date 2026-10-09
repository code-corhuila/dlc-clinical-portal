import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ClinicalRecordEntriesWorkflow,
  type ClinicalRecordEntriesPort,
} from '../../../../application/clinicalRecordEntriesWorkflow';
import type { RecordClinicalEntry } from '../../../../application/recordClinicalEntry';
import type { ReadPatientForCare } from '../../../../application/readPatientForCare';
import {
  resolveClinicalAccess,
  resolveClinicalWriteAccess,
  type ClinicalRole,
} from '../../../../model/clinicalAccess';
import type { ClinicalRecordStatus } from '../../../../model/clinicalRecordView';
import type { ClinicalEntryRequest } from '../../../../model/clinicalEntryRequest';
import type { PatientForCare } from '../../../../model/patientForCare';
import { ClinicalRecordEntries } from '../components/ClinicalRecordEntries';
import { ClinicalEntryComposer } from '../components/ClinicalEntryComposer';
import { PatientHeader } from '../components/PatientHeader';
import { QuickNoteForm } from '../components/QuickNoteForm';
import { TreatmentPlanCard } from '../components/TreatmentPlanCard';
import type { TreatmentPlan } from '../../../../application/treatmentPlan';
import type { AmendClinicalEntry } from '../../../../application/amendClinicalEntry';

export interface ClinicalPortalPageProps {
  readonly patientId?: string | null;
  readonly role?: ClinicalRole | null;
  readonly clinicalReadAuthorized?: boolean;
  readonly clinicalWriteAuthorized?: boolean;
  readonly readPort?: ClinicalRecordEntriesPort;
  readonly writer?: RecordClinicalEntry;
  readonly authorName?: (authorId: string) => string;
  readonly patientReader?: ReadPatientForCare;
  readonly amender?: AmendClinicalEntry;
  readonly treatments?: {
    readonly plan: TreatmentPlan;
    readonly catalog: readonly { code: string; label: string }[];
    readonly appointmentId?: string;
  };
}

interface PatientView {
  readonly patientId: string;
  readonly context: object;
  readonly patient: PatientForCare;
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
  patientReader,
  treatments,
  amender,
}: ClinicalPortalPageProps) {
  const request = useRef(0);
  const [retry, setRetry] = useState(0);
  const [patientView, setPatientView] = useState<PatientView>();
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
    () => ({ workflow, patientReader, allowed, role, clinicalReadAuthorized }),
    [allowed, clinicalReadAuthorized, patientReader, role, workflow],
  );

  useEffect(() => {
    let active = true;
    if (patientId && patientReader)
      patientReader
        .execute(patientId, role, clinicalReadAuthorized)
        .then((patient) => {
          if (active) setPatientView({ patientId, context, patient });
        })
        .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [clinicalReadAuthorized, context, patientId, patientReader, role]);

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
  const patient =
    allowed &&
    patientView?.patientId === patientId &&
    patientView?.context === context
      ? patientView.patient
      : undefined;
  const submitEntry =
    writer && patientId
      ? async (entry: ClinicalEntryRequest) => {
          await writer.execute(
            { patientId, role, clinicalWriteAuthorized },
            entry,
          );
          setRetry((value) => value + 1);
        }
      : undefined;
  const treatmentPlan = treatments?.plan;
  const loadTreatments = useMemo(
    () =>
      treatmentPlan && patientId
        ? () =>
            treatmentPlan.list({
              patientId,
              role,
              clinicalAuthorized: clinicalReadAuthorized,
            })
        : undefined,
    [clinicalReadAuthorized, patientId, role, treatmentPlan],
  );
  const canWrite =
    writer !== undefined &&
    status.kind === 'ready' &&
    resolveClinicalWriteAccess(role, clinicalWriteAuthorized) === 'granted';

  return (
    <main
      className="portal-placeholder"
      aria-labelledby="clinical-portal-title"
    >
      <h1 id="clinical-portal-title">
        {bound ? 'Historia clínica' : 'Clinical portal'}
      </h1>
      {bound ? (
        <div className="cl-workspace">
          {patient && (
            <PatientHeader
              patient={patient}
              onNewEntry={
                canWrite
                  ? () => document.getElementById('entry-text')?.focus()
                  : undefined
              }
            />
          )}
          <ClinicalRecordEntries
            role={role}
            clinicalReadAuthorized={clinicalReadAuthorized}
            status={status}
            authorName={authorName}
            onAmend={
              canWrite && amender
                ? async (entry, correction) => {
                    await amender.execute(
                      { role, clinicalWriteAuthorized },
                      entry,
                      correction,
                    );
                    setRetry((value) => value + 1);
                  }
                : undefined
            }
            onRetry={
              allowed && patientId
                ? () => setRetry((value) => value + 1)
                : undefined
            }
          >
            {canWrite && submitEntry && (
              <QuickNoteForm onSubmit={submitEntry} />
            )}
          </ClinicalRecordEntries>
          {treatments && loadTreatments && allowed && patientId && (
            <TreatmentPlanCard
              key={`${patientId}:${role}:${clinicalReadAuthorized}:${clinicalWriteAuthorized}`}
              load={loadTreatments}
              catalog={treatments.catalog}
              appointmentId={treatments.appointmentId}
              diagnoses={
                status.kind === 'ready'
                  ? status.page.data
                      .filter((entry) => entry.kind === 'DIAGNOSIS')
                      .map((entry) => ({ id: entry.id, label: entry.text }))
                  : []
              }
              onStart={
                resolveClinicalWriteAccess(role, clinicalWriteAuthorized) ===
                'granted'
                  ? (treatment) =>
                      treatments.plan.start(
                        {
                          patientId,
                          role,
                          clinicalAuthorized: clinicalWriteAuthorized,
                        },
                        treatment,
                      )
                  : undefined
              }
              onPlan={
                resolveClinicalWriteAccess(role, clinicalWriteAuthorized) ===
                'granted'
                  ? (draft) =>
                      treatments.plan.plan(
                        {
                          patientId,
                          role,
                          clinicalAuthorized: clinicalWriteAuthorized,
                        },
                        draft,
                      )
                  : undefined
              }
            />
          )}
          <ClinicalEntryComposer
            role={role}
            clinicalWriteAuthorized={clinicalWriteAuthorized}
            recordWritable={status.kind === 'ready'}
            consultations={
              status.kind === 'ready'
                ? status.page.data
                    .filter((entry) => entry.kind === 'CONSULTATION')
                    .map((entry) => ({ id: entry.id, label: entry.text }))
                : []
            }
            onSubmit={submitEntry}
          />
        </div>
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
