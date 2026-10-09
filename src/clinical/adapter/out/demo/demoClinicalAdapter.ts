import type { ClinicalRecordEntriesPort } from '../../../application/clinicalRecordEntriesWorkflow';
import type { ClinicalEntryWritePort } from '../../../application/recordClinicalEntry';
import type { PatientForCarePort } from '../../../application/readPatientForCare';
import type { PatientForCare } from '../../../model/patientForCare';
import type { TreatmentPort } from '../../../application/treatmentPlan';
import type { Treatment } from '../../../model/treatment';
import type {
  ClinicalEntry,
  ClinicalEntryPage,
} from '../../../model/clinicalEntry';
import {
  consultationEntry,
  evolutionEntry,
} from '../../../fixtures/clinicalFixtures';

/** In-memory synthetic adapter, wired only by the dev demo composition. */
export interface DemoClinicalAdapter
  extends
    ClinicalRecordEntriesPort,
    ClinicalEntryWritePort,
    PatientForCarePort,
    TreatmentPort {
  authorName(authorId: string): string;
}

/** Synthetic Billing catalog references: codes and names only, never prices. */
export const demoProcedureCatalog = [
  { code: 'D1110', label: 'Limpieza profunda' },
  { code: 'D2391', label: 'Resina simple' },
  { code: 'D7140', label: 'Extracción simple' },
] as const;

/** Synthetic EN_ATENCION appointment per assigned patient. */
export const demoAppointments: Record<string, string> = {
  'patient-a': 'appointment-a',
  'patient-b': 'appointment-b',
};

const records: Record<string, string> = {
  'patient-a': 'record-a',
  'patient-b': 'record-b',
};
const patients: Record<string, PatientForCare> = {
  'patient-a': {
    id: 'patient-a',
    name: 'Ana García Rodríguez',
    phone: '+57 300 123 4567',
    status: 'ACTIVE',
    version: 1,
  },
  'patient-b': {
    id: 'patient-b',
    name: 'Mateo Herrera Gómez',
    phone: '+57 310 765 4321',
    status: 'ACTIVE',
    version: 1,
  },
};
const authors: Record<string, string> = {
  'demo-dentist': 'Dra. Valentina Ruiz',
  [consultationEntry.authorId]: 'Dra. Valentina Ruiz',
  [evolutionEntry.authorId]: 'Dr. Mateo López',
};

export function createDemoClinicalAdapter(): DemoClinicalAdapter {
  const entries: Record<string, ClinicalEntry[]> = {
    'record-a': [{ ...consultationEntry, recordId: 'record-a' }],
    'record-b': [{ ...evolutionEntry, recordId: 'record-b' }],
  };
  const treatments: Record<string, Treatment[]> = {
    'patient-a': [
      {
        id: 'treatment-a-1',
        patientId: 'patient-a',
        clinicalReason: 'Profilaxis de control',
        status: 'PLANNED',
        procedures: [
          {
            id: 'procedure-a-1',
            procedureCode: 'D1110',
            appointmentId: 'appointment-a',
            status: 'PLANNED',
          },
        ],
        version: 1,
      },
    ],
    'patient-b': [],
  };
  return {
    async listTreatments(patientId) {
      if (!treatments[patientId]) throw { code: 'FORBIDDEN' };
      return treatments[patientId];
    },
    async planTreatment(request) {
      const list = treatments[request.patientId];
      if (!list) throw { code: 'FORBIDDEN' };
      const id = `treatment-${request.patientId}-${list.length + 1}`;
      const treatment: Treatment = {
        ...request,
        id,
        status: 'PLANNED',
        procedures: request.procedures.map((item, index) => ({
          ...item,
          id: `${id}-procedure-${index + 1}`,
          status: 'PLANNED',
        })),
        version: 1,
      };
      treatments[request.patientId] = [...list, treatment];
      return treatment;
    },
    async readPatient(patientId) {
      const patient = patients[patientId];
      if (!patient) throw { code: 'FORBIDDEN' };
      return patient;
    },
    async findRecordId(patientId) {
      const recordId = records[patientId];
      if (!recordId) throw { code: 'FORBIDDEN' };
      return recordId;
    },
    async readEntries(recordId): Promise<ClinicalEntryPage> {
      const data = entries[recordId];
      if (!data)
        throw {
          code: 'NOT_FOUND',
          message: 'El registro clínico no está disponible.',
        };
      return {
        data,
        meta: { page: 1, limit: 20, total: data.length, totalPages: 1 },
      };
    },
    async appendEntry(recordId, request) {
      if (!entries[recordId]) throw { code: 'FORBIDDEN' };
      const linked = entries[recordId].some(
        (entry) =>
          entry.kind === 'CONSULTATION' && entry.id === request.consultationId,
      );
      if (request.kind === 'DIAGNOSIS' && !linked)
        throw {
          code: 'CONFLICT',
          message: 'La consulta no pertenece a este registro clínico.',
        };
      const entry: ClinicalEntry = {
        id: `demo-${recordId}-${entries[recordId].length + 1}`,
        recordId,
        kind: request.kind,
        text: request.text,
        consultationId: request.consultationId,
        authorId: 'demo-dentist',
        createdAt: '2026-10-08T12:00:00.000Z',
        version: 1,
      };
      entries[recordId] = [...entries[recordId], entry];
    },
    authorName: (authorId) => authors[authorId] ?? authorId,
  };
}
