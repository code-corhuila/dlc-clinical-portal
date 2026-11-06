import { useState } from 'react';
import {
  createInMemoryClinicalAdapter,
  testAppointments,
  testProcedureCatalog,
} from './inMemoryClinicalAdapter';
import type { ClinicalRecordEntriesPort } from '../application/clinicalRecordEntriesWorkflow';
import { RecordClinicalEntry } from '../application/recordClinicalEntry';
import { ReadPatientForCare } from '../application/readPatientForCare';
import { TreatmentPlan } from '../application/treatmentPlan';
import { CompleteProcedure } from '../application/completeProcedure';
import { DeclareCareCompletion } from '../application/declareCareCompletion';
import { CareClosureTracking } from '../application/careClosureTracking';
import { BillingEstimate } from '../application/billingEstimate';
import { AmendClinicalEntry } from '../application/amendClinicalEntry';
import type { ClinicalRole } from '../model/clinicalAccess';
import { ClinicalPortalPage } from '../adapter/in/ui/pages/ClinicalPortalPage';
import { ClinicalDashboardPage } from '../adapter/in/ui/pages/ClinicalDashboardPage';
import { ReadDashboard } from '../application/readDashboard';

/** Synthetic patients offered by the test patient selector. */
const TEST_PATIENTS = [
  ['patient-a', 'Paciente sintético A'],
  ['patient-b', 'Paciente sintético B'],
  ['patient-c', 'Paciente sintético C'],
  ['patient-d', 'Paciente sintético D (atención cerrada)'],
  ['patient-e', 'Valentina Castro Ríos (tratamiento en curso)'],
  ['patient-f', 'Santiago Ruiz Morales (alergia y antecedente)'],
  ['patient-g', 'Isabella Moreno Díaz (tratamiento completado)'],
  ['patient-h', 'Daniel Vargas Pineda (inactivo)'],
  ['patient-i', 'Camila Ortiz Restrepo (sin registros)'],
  ['patient-j', 'Andrés Mejía Cárdenas (tratamiento cancelado)'],
] as const;

export interface ClinicalTestWorkspaceProps {
  /** Inside dlc-front: the route owns the patient and the session owns the role. */
  readonly embedded?: boolean;
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

/** Synthetic signed-in staff per role (the shell session supplies it in production). */
const TEST_STAFF: Record<ClinicalRole, { id: string; name: string }> = {
  DENTIST: { id: 'demo-dentist', name: 'Dra. Valentina Ruiz' },
  ADMINISTRATOR: { id: 'demo-admin', name: 'Laura Gómez' },
  SECRETARY_ASSISTANT: { id: 'demo-assistant', name: 'Camila Rojas' },
};

/** Test-only context controls over injected use cases; never imported by production code. */
export function ClinicalTestWorkspace({
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
  embedded = false,
}: ClinicalTestWorkspaceProps) {
  const [patientId, setPatientId] = useState(initialPatientId ?? 'patient-a');
  const [role, setRole] = useState<ClinicalRole>(initialRole ?? 'DENTIST');
  const [readAuthorized, setReadAuthorized] = useState(true);
  const [writeAuthorized, setWriteAuthorized] = useState(true);
  const [view, setView] = useState<'record' | 'dashboard'>('record');

  return (
    <section aria-label="Controles de prueba clínica">
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
      {!embedded && (
        <label>
          Paciente
          <select
            aria-label="Paciente"
            value={patientId}
            onChange={(event) => setPatientId(event.target.value)}
          >
            {TEST_PATIENTS.map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </label>
      )}
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
          staffId={TEST_STAFF[role].id}
          staffName={TEST_STAFF[role].name}
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

/** Wires the workspace over the in-memory adapter, as tests render it. */
export function InMemoryClinicalTestWorkspace({
  initialPatientId,
  initialRole,
}: Pick<ClinicalTestWorkspaceProps, 'initialPatientId' | 'initialRole'>) {
  const [adapter] = useState(createInMemoryClinicalAdapter);
  const [writer] = useState(() => new RecordClinicalEntry(adapter));
  const [patientReader] = useState(() => new ReadPatientForCare(adapter));
  const [treatmentPlan] = useState(() => new TreatmentPlan(adapter));
  const [completer] = useState(
    () => new CompleteProcedure(adapter, () => crypto.randomUUID()),
  );
  const [amender] = useState(() => new AmendClinicalEntry(adapter));
  const [declarer] = useState(() => new DeclareCareCompletion(adapter));
  const [tracking] = useState(() => new CareClosureTracking(adapter));
  const [estimate] = useState(() => new BillingEstimate(adapter));
  const [dashboard] = useState(
    () => new ReadDashboard(adapter, () => new Date()),
  );

  return (
    <ClinicalTestWorkspace
      initialPatientId={initialPatientId}
      initialRole={initialRole}
      readPort={adapter}
      writer={writer}
      authorName={adapter.authorName}
      patientReader={patientReader}
      treatmentPlan={treatmentPlan}
      completer={completer}
      declarer={declarer}
      tracking={tracking}
      estimate={estimate}
      dashboard={dashboard}
      amender={amender}
      catalog={testProcedureCatalog}
      appointments={testAppointments}
    />
  );
}
