import { useState } from 'react';
import type { ClinicalRecordEntriesPort } from '../../../../application/clinicalRecordEntriesWorkflow';
import type { RecordClinicalEntry } from '../../../../application/recordClinicalEntry';
import type { ReadPatientForCare } from '../../../../application/readPatientForCare';
import type { TreatmentPlan } from '../../../../application/treatmentPlan';
import type { ClinicalRole } from '../../../../model/clinicalAccess';
import { ClinicalPortalPage } from './ClinicalPortalPage';

export interface ClinicalDemoPageProps {
  readonly readPort: ClinicalRecordEntriesPort;
  readonly writer: RecordClinicalEntry;
  readonly authorName: (authorId: string) => string;
  readonly patientReader: ReadPatientForCare;
  readonly treatmentPlan: TreatmentPlan;
  readonly catalog: readonly { code: string; label: string }[];
}

/** Dev-only context controls; dependencies are injected by composition. */
export function ClinicalDemoPage({
  readPort,
  writer,
  authorName,
  patientReader,
  treatmentPlan,
  catalog,
}: ClinicalDemoPageProps) {
  const [patientId, setPatientId] = useState('patient-a');
  const [role, setRole] = useState<ClinicalRole>('DENTIST');
  const [readAuthorized, setReadAuthorized] = useState(true);
  const [writeAuthorized, setWriteAuthorized] = useState(true);

  return (
    <section className="cl-demo" aria-label="Controles de demostración clínica">
      <p>Modo demostración — datos sintéticos</p>
      <label>
        Paciente
        <select
          value={patientId}
          onChange={(event) => setPatientId(event.target.value)}
        >
          <option value="patient-a">Paciente sintético A</option>
          <option value="patient-b">Paciente sintético B</option>
          <option value="patient-c">Paciente sintético C</option>
        </select>
      </label>
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
      <ClinicalPortalPage
        patientId={patientId}
        role={role}
        clinicalReadAuthorized={readAuthorized}
        clinicalWriteAuthorized={writeAuthorized}
        readPort={readPort}
        writer={writer}
        authorName={authorName}
        patientReader={patientReader}
        treatments={{ plan: treatmentPlan, catalog }}
      />
    </section>
  );
}
