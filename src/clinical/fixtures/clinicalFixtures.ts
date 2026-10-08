/** Deterministic synthetic fixtures for tests and the VITE_CLINICAL_DEMO demo. */
import type { ClinicalEntry } from '../model/clinicalEntry';
import type { ClinicalRecordStatus } from '../model/clinicalRecordView';

export const consultationEntry: ClinicalEntry = {
  id: 'e1c00000-0000-4000-8000-000000000001',
  recordId: 'e1c00000-0000-4000-8000-0000000000f1',
  kind: 'CONSULTATION',
  text: 'Consulta sintética de demostración: revisión inicial sin datos reales.',
  authorId: 'a0700000-0000-4000-8000-0000000000d1',
  createdAt: '2026-03-02T14:30:00.000Z',
  version: 1,
};

export const evolutionEntry: ClinicalEntry = {
  id: 'e1c00000-0000-4000-8000-000000000002',
  recordId: 'e1c00000-0000-4000-8000-0000000000f1',
  kind: 'EVOLUTION',
  text: 'Evolución sintética de demostración: seguimiento sin datos reales.',
  authorId: 'a0700000-0000-4000-8000-0000000000d2',
  version: 1,
};

export const demoRecordStatus: ClinicalRecordStatus = {
  kind: 'ready',
  page: {
    data: [consultationEntry, evolutionEntry],
    meta: { page: 1, limit: 20, total: 2, totalPages: 1 },
  },
};
