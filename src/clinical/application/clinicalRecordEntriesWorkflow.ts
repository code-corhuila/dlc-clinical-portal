import type { ClinicalEntryPage } from '../model/clinicalEntry';
import type { ClinicalRecordStatus } from '../model/clinicalRecordView';

/** Host-provided read boundary; it deliberately contains no HTTP details. */
export interface ClinicalRecordEntriesPort {
  findRecordId(patientId: string): Promise<string>;
  readEntries(recordId: string): Promise<ClinicalEntryPage>;
}

interface PortFailure {
  readonly code?: string;
  readonly message?: string;
}

function normalizePortFailure(error: unknown): PortFailure {
  if (typeof error !== 'object' || error === null) return {};
  const values = error as Record<string, unknown>;
  return {
    code: typeof values.code === 'string' ? values.code : undefined,
    message: typeof values.message === 'string' ? values.message : undefined,
  };
}

/**
 * Coordinates patient-route context with the Clinical record resource.
 * A generation guard means a completed older request cannot replace newer data.
 */
export class ClinicalRecordEntriesWorkflow {
  status: ClinicalRecordStatus = { kind: 'loading' };
  private generation = 0;

  constructor(private readonly port: ClinicalRecordEntriesPort) {}

  async load(patientId: string): Promise<void> {
    const generation = ++this.generation;
    this.status = { kind: 'loading' };
    try {
      const recordId = await this.port.findRecordId(patientId);
      if (generation !== this.generation) return;
      const page = await this.port.readEntries(recordId);
      if (generation === this.generation) this.status = { kind: 'ready', page };
    } catch (error: unknown) {
      if (generation !== this.generation) return;
      const failure = normalizePortFailure(error);
      this.status =
        failure.code === 'FORBIDDEN'
          ? { kind: 'forbidden' }
          : {
              kind: 'error',
              message:
                failure.message ?? 'No fue posible cargar el registro clínico.',
            };
    }
  }
}
