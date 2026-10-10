import type { ClinicalEntryPage } from '../model/clinicalEntry';
import type { ClinicalRecordStatus } from '../model/clinicalRecordView';
import { portFailureMessage } from '../model/portFailure';

/** Host-provided read boundary; it deliberately contains no HTTP details. */
export interface ClinicalRecordEntriesPort {
  findRecordId(patientId: string): Promise<string>;
  readEntries(recordId: string): Promise<ClinicalEntryPage>;
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
      const code = (error as { code?: unknown } | null)?.code;
      // C06: a cancelled request is obsolete; a newer one owns the view.
      if (code === 'CANCELLED') return;
      this.status =
        code === 'FORBIDDEN'
          ? { kind: 'forbidden' }
          : {
              kind: 'error',
              message: portFailureMessage(
                error,
                'No fue posible cargar el registro clínico.',
              ),
            };
    }
  }
}
