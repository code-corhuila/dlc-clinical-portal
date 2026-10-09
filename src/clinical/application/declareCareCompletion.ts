import {
  resolveClinicalWriteAccess,
  type ClinicalRole,
} from '../model/clinicalAccess';
import type {
  CareCompletionRequest,
  ClinicalCareCompletion,
} from '../model/careCompletion';

/** Host-provided care-completion boundary; it deliberately contains no HTTP details. */
export interface CareCompletionPort {
  findRecordId(patientId: string): Promise<string>;
  readRecordVersion(recordId: string): Promise<number>;
  declareCareCompleted(
    recordId: string,
    request: CareCompletionRequest,
    idempotencyKey: string,
  ): Promise<ClinicalCareCompletion>;
}

export interface CareCompletionAccess {
  readonly patientId: string;
  readonly role: ClinicalRole | null;
  readonly clinicalWriteAuthorized: boolean;
  /** One key per user intent, reused on retries (Annex H). */
  readonly idempotencyKey: string;
}

/**
 * HU-XCT-001: only the assigned Dentist declares all encounter clinical work
 * saved. Administrative finalization stays with Appointments.
 */
export class DeclareCareCompletion {
  constructor(private readonly port: CareCompletionPort) {}

  async execute(
    access: CareCompletionAccess,
    declaration: {
      readonly consultationId: string;
      readonly appointmentId: string;
    },
  ): Promise<ClinicalCareCompletion> {
    const granted = resolveClinicalWriteAccess(
      access.role,
      access.clinicalWriteAuthorized,
    );
    if (access.role !== 'DENTIST' || granted !== 'granted')
      throw { code: 'FORBIDDEN' };
    if (!declaration.consultationId)
      throw {
        code: 'INVALID',
        message: 'Seleccione la consulta de la atención.',
      };
    if (!declaration.appointmentId)
      throw {
        code: 'INVALID',
        message: 'La declaración requiere la cita en atención.',
      };
    if (!access.idempotencyKey)
      throw {
        code: 'INVALID',
        message: 'Falta la clave de idempotencia de la operación.',
      };

    const recordId = await this.port.findRecordId(access.patientId);
    const expectedVersion = await this.port.readRecordVersion(recordId);
    return this.port.declareCareCompleted(
      recordId,
      {
        ...declaration,
        expectedVersion,
      },
      access.idempotencyKey,
    );
  }
}
