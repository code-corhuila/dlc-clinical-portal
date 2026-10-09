import type { ClinicalRecordEntriesPort } from '../../../application/clinicalRecordEntriesWorkflow';
import type { ClinicalEntryWritePort } from '../../../application/recordClinicalEntry';
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
  extends ClinicalRecordEntriesPort, ClinicalEntryWritePort {
  authorName(authorId: string): string;
}

const records: Record<string, string> = {
  'patient-a': 'record-a',
  'patient-b': 'record-b',
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
  return {
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
      const entry: ClinicalEntry = {
        id: `demo-${recordId}-${entries[recordId].length + 1}`,
        recordId,
        kind: request.kind,
        text: request.text,
        authorId: 'demo-dentist',
        createdAt: '2026-10-08T12:00:00.000Z',
        version: 1,
      };
      entries[recordId] = [...entries[recordId], entry];
    },
    authorName: (authorId) => authors[authorId] ?? authorId,
  };
}
