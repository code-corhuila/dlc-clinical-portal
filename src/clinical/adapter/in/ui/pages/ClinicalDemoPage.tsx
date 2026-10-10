import { useState } from 'react';
import type { ClinicalRecordEntriesPort } from '../../../../application/clinicalRecordEntriesWorkflow';
import type { RecordClinicalEntry } from '../../../../application/recordClinicalEntry';
import type { ReadPatientForCare } from '../../../../application/readPatientForCare';
import type { TreatmentPlan } from '../../../../application/treatmentPlan';
import type { CompleteProcedure } from '../../../../application/completeProcedure';
import type { DeclareCareCompletion } from '../../../../application/declareCareCompletion';
import type { CareClosureTracking } from '../../../../application/careClosureTracking';
import type { BillingEstimate } from '../../../../application/billingEstimate';
import type { AmendClinicalEntry } from '../../../../application/amendClinicalEntry';
import type { ClinicalRole } from '../../../../model/clinicalAccess';
import { ClinicalPortalPage } from './ClinicalPortalPage';
import { ClinicalDashboardPage } from './ClinicalDashboardPage';
import type { ReadDashboard } from '../../../../application/readDashboard';

/** Synthetic patients offered by the demo patient selector. */
export const DEMO_PATIENTS = [
  ['patient-a', 'Paciente sintético A'],
  ['patient-b', 'Paciente sintético B'],
  ['patient-c', 'Paciente sintético C'],
  ['patient-d', 'Paciente sintético D (atención cerrada)'],
] as const;

export interface ClinicalDemoPageProps {
  /** Inside dlc-front: the route owns the patient and the session owns the role. */
  readonly onSelectPatient?: (patientId: string) => void;
  readonly initialPatientId?: string;
  readonly initialRole?: ClinicalRole;
  readonly readPort: ClinicalRecordEntriesPort;
  readonly writer: RecordClinicalEntry;
  readonly authorName: (authorId: string) => string;
  readonly patientReader: ReadPatientForCare;
  readonly treatmentPlan: TreatmentPlan;
  readonly completer: CompleteProcedure;
  readonly declarer: DeclareCareCompletion;
  readonly tracking: CareClosureTracking;
  readonly estimate: BillingEstimate;
  readonly dashboard: ReadDashboard;
  readonly amender: AmendClinicalEntry;
  readonly catalog: readonly { code: string; label: string }[];
  readonly appointments: Readonly<Record<string, string>>;
}

/** Synthetic signed-in staff per demo role (the shell session supplies it in production). */
const DEMO_STAFF: Record<ClinicalRole, { id: string; name: string }> = {
  DENTIST: { id: 'demo-dentist', name: 'Dra. Valentina Ruiz' },
  ADMINISTRATOR: { id: 'demo-admin', name: 'Laura Gómez' },
  SECRETARY_ASSISTANT: { id: 'demo-assistant', name: 'Camila Rojas' },
};

/** Dev-only context controls; dependencies are injected by composition. */
export function ClinicalDemoPage({
  readPort,
  writer,
  authorName,
  patientReader,
  treatmentPlan,
  completer,
  declarer,
  tracking,
  estimate,
  dashboard,
  amender,
  catalog,
  appointments,
  initialPatientId,
  initialRole,
  onSelectPatient,
}: ClinicalDemoPageProps) {
  const embedded = Boolean(onSelectPatient);
  const [patientId, setPatientId] = useState(initialPatientId ?? 'patient-a');
  const [role, setRole] = useState<ClinicalRole>(initialRole ?? 'DENTIST');
  const [readAuthorized, setReadAuthorized] = useState(true);
  const [writeAuthorized, setWriteAuthorized] = useState(true);
  const [view, setView] = useState<'record' | 'dashboard'>('record');

  return (
    <section className="cl-demo" aria-label="Controles de demostración clínica">
      <p>Modo demostración — datos sintéticos</p>
      {!embedded && (
        <label>
          Vista
          <select
            value={view}
            onChange={(event) =>
              setView(event.target.value as 'record' | 'dashboard')
            }
          >
            <option value="record">Historia clínica</option>
            <option value="dashboard">Dashboard</option>
          </select>
        </label>
      )}
      <label>
        Paciente
        <select
          aria-label="Paciente"
          value={patientId}
          onChange={(event) =>
            onSelectPatient
              ? onSelectPatient(event.target.value)
              : setPatientId(event.target.value)
          }
        >
          {DEMO_PATIENTS.map(([id, label]) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </select>
      </label>
      {!embedded && (
        <>
          <label>
            Rol
            <select
              value={role}
              onChange={(event) => setRole(event.target.value as ClinicalRole)}
            >
              <option value="DENTIST">Odontólogo</option>
              <option value="ADMINISTRATOR">Administrador</option>
              <option value="SECRETARY_ASSISTANT">Asistente</option>
            </select>
          </label>
          <label>
            <input
              type="checkbox"
              checked={readAuthorized}
              onChange={(event) => setReadAuthorized(event.target.checked)}
            />
            Autorización clínica de lectura
          </label>
          <label>
            <input
              type="checkbox"
              checked={writeAuthorized}
              onChange={(event) => setWriteAuthorized(event.target.checked)}
            />
            Autorización clínica de escritura
          </label>
        </>
      )}
      {view === 'dashboard' ? (
        <ClinicalDashboardPage
          reader={dashboard}
          role={role}
          staffId={DEMO_STAFF[role].id}
          staffName={DEMO_STAFF[role].name}
        />
      ) : (
        <ClinicalPortalPage
          patientId={patientId}
          role={role}
          clinicalReadAuthorized={readAuthorized}
          clinicalWriteAuthorized={writeAuthorized}
          readPort={readPort}
          writer={writer}
          authorName={authorName}
          patientReader={patientReader}
          amender={amender}
          declarer={declarer}
          treatments={{
            plan: treatmentPlan,
            completer,
            tracking,
            estimate,
            catalog,
            appointmentId: appointments[patientId],
          }}
        />
      )}
    </section>
  );
}
