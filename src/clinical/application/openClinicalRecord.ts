import {
  resolveClinicalWriteAccess,
  type ClinicalRole,
} from '../model/clinicalAccess';
import { ClinicalEntryWriteError } from './recordClinicalEntry';

/** Host-provided write boundary; it deliberately contains no HTTP details. */
export interface ClinicalRecordOpenPort {
  /** `idempotencyKey` maps to the contract `Idempotency-Key` header. */
  openRecord(patientId: string, idempotencyKey: string): Promise<void>;
}

export interface OpenRecordContext {
  readonly patientId: string;
  readonly role: ClinicalRole | null;
  readonly clinicalWriteAuthorized: boolean;
  /** One key per user intent, reused when that intent is retried. */
  readonly idempotencyKey: string;
}

/** Opens the longitudinal record of an assigned patient (HU-CLN-001); the owner authorizes. */
export class OpenClinicalRecord {
  constructor(private readonly port: ClinicalRecordOpenPort) {}

  async execute(context: OpenRecordContext): Promise<void> {
    if (
      resolveClinicalWriteAccess(
        context.role,
        context.clinicalWriteAuthorized,
      ) !== 'granted'
    )
      throw new ClinicalEntryWriteError(
        'FORBIDDEN',
        'No tiene autorización clínica para abrir la historia.',
      );
    if (!context.idempotencyKey)
      throw new ClinicalEntryWriteError(
        'INVALID',
        'Falta la clave de idempotencia.',
      );
    await this.port.openRecord(context.patientId, context.idempotencyKey);
  }
}
