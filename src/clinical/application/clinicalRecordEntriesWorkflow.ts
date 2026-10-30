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
    let recordId: string;
    try {
      recordId = await this.port.findRecordId(patientId);
    } catch (error: unknown) {
      if (generation !== this.generation) return;
      // No record yet for this patient: it can be opened, it is not a failure.
      if ((error as { code?: unknown } | null)?.code === 'NOT_FOUND') {
        this.status = { kind: 'missing' };
        return;
      }
      this.fail(error);
      return;
    }
    try {
      if (generation !== this.generation) return;
      const page = await this.port.readEntries(recordId);
      if (generation === this.generation) this.status = { kind: 'ready', page };
    } catch (error: unknown) {
      if (generation !== this.generation) return;
      this.fail(error);
    }
  }

  private fail(error: unknown): void {
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
